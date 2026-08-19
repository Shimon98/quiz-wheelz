package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionChoiceRepository;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * get-or-create delivery of the current student question.
 *
 * Concurrency (C1-02K): question lifecycle is serialized PER RacePlayer by
 * taking the existing PESSIMISTIC_WRITE RacePlayer row lock BEFORE the
 * ACTIVE-question lookup — the same pattern answer submission already uses.
 * Two near-simultaneous requests (StrictMode, double tab, retry) therefore
 * cannot both see "no active question" and create two: the second waits,
 * then finds the first one's question. Different RacePlayers stay fully
 * independent.
 *
 * The QuestionPlan is built AFTER the lock and only when a new question is
 * actually needed — it reads mutable player state (currentDifficulty,
 * generated-question count), so building it pre-lock could use stale data.
 */
@Service
public class StudentQuestionDeliveryService {

    private final RacePlayerRepository racePlayerRepository;
    private final PlayerQuestionRepository playerQuestionRepository;
    private final PlayerQuestionChoiceRepository playerQuestionChoiceRepository;
    private final RacePlayerQuestionPlanService racePlayerQuestionPlanService;
    private final QuestionGenerationService questionGenerationService;
    private final PlayerQuestionPersistenceService playerQuestionPersistenceService;
    private final StudentQuestionResponseMapper studentQuestionResponseMapper;
    private final RaceMovementService raceMovementService;
    private final QuestionTimeoutService questionTimeoutService;
    private final Clock clock;

    // Shared application Clock (TimeConfig) — the same source that decides
    // expiry also produces the public epoch timing contract.
    public StudentQuestionDeliveryService(
            RacePlayerRepository racePlayerRepository,
            PlayerQuestionRepository playerQuestionRepository,
            PlayerQuestionChoiceRepository playerQuestionChoiceRepository,
            RacePlayerQuestionPlanService racePlayerQuestionPlanService,
            QuestionGenerationService questionGenerationService,
            PlayerQuestionPersistenceService playerQuestionPersistenceService,
            StudentQuestionResponseMapper studentQuestionResponseMapper,
            RaceMovementService raceMovementService,
            QuestionTimeoutService questionTimeoutService,
            Clock clock
    ) {
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.playerQuestionChoiceRepository = Objects.requireNonNull(playerQuestionChoiceRepository);
        this.racePlayerQuestionPlanService = Objects.requireNonNull(racePlayerQuestionPlanService);
        this.questionGenerationService = Objects.requireNonNull(questionGenerationService);
        this.playerQuestionPersistenceService = Objects.requireNonNull(playerQuestionPersistenceService);
        this.studentQuestionResponseMapper = Objects.requireNonNull(studentQuestionResponseMapper);
        this.raceMovementService = Objects.requireNonNull(raceMovementService);
        this.questionTimeoutService = Objects.requireNonNull(questionTimeoutService);
        this.clock = Objects.requireNonNull(clock);
    }

    // noRollbackFor (C1-03M): settlement can finish the player mid-resolve;
    // the resulting RACE_PLAYER_NOT_RACING must still COMMIT that movement
    // truth (the client resyncs race-state and sees FINISHED).
    @Transactional(noRollbackFor = ApiException.class)
    public StudentQuestionResponse getOrCreateCurrentQuestion(RacePlayer racePlayer) {
        RacePlayer lockedRacePlayer = findLockedRacePlayer(racePlayer);

        Optional<PlayerQuestion> active = playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        lockedRacePlayer,
                        PlayerQuestionStatus.ACTIVE
                );

        // ONE decision instant: the same moment decides expiry, settles
        // movement AND is the response's serverTimeEpochMs, so a returned
        // ACTIVE question can never carry a server time at/after its own
        // deadline.
        Instant decisionInstant = clock.instant();
        LocalDateTime decisionNow =
                DateTimeUtils.toLocalDateTime(decisionInstant, clock.getZone());
        long decisionEpochMs = decisionInstant.toEpochMilli();

        if (active.isPresent()) {
            PlayerQuestion activeQuestion = active.get();
            validateExistingQuestion(activeQuestion);

            if (!DateTimeUtils.isExpired(activeQuestion.getExpiresAt(), decisionNow)) {
                // Continuous movement is settled on every resolve; if the
                // player crossed the line while thinking, the validation
                // below rejects instead of returning another question.
                raceMovementService.settleTo(lockedRacePlayer, decisionEpochMs);
                validateLockedRacePlayerCanReceiveQuestion(lockedRacePlayer);

                return mapToStudentResponse(activeQuestion, decisionEpochMs);
            }

            // Timeout gameplay has ONE owner: settles to the deadline at the
            // old speed, expires, penalizes once, settles the remainder.
            questionTimeoutService.processExpiredActiveQuestion(
                    lockedRacePlayer,
                    activeQuestion,
                    decisionEpochMs
            );
        } else {
            raceMovementService.settleTo(lockedRacePlayer, decisionEpochMs);
        }

        // The controller's pre-check happened BEFORE the lock; state may have
        // changed while waiting for it (a concurrent answer — or the
        // settlement above — finished the player/race). Only the LOCKED row
        // is authoritative — without this re-check a FINISHED player could
        // receive a fresh ACTIVE question.
        validateLockedRacePlayerCanReceiveQuestion(lockedRacePlayer);

        return generatePersistAndMapQuestion(lockedRacePlayer);
    }

    private void validateLockedRacePlayerCanReceiveQuestion(RacePlayer racePlayer) {
        if (racePlayer.getStatus() != RacePlayerStatus.RACING) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NOT_RACING);
        }

        Race race = racePlayer.getRace();

        if (race == null || race.getStatus() != RaceStatus.IN_PROGRESS) {
            throw new ApiException(ErrorCode.RACE_NOT_IN_PROGRESS);
        }
    }

    private RacePlayer findLockedRacePlayer(RacePlayer racePlayer) {
        if (racePlayer == null
                || racePlayer.getId() == null
                || racePlayer.getRace() == null
                || racePlayer.getRace().getId() == null) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND);
        }

        return racePlayerRepository
                .findLockedByIdAndRaceId(
                        racePlayer.getId(),
                        racePlayer.getRace().getId()
                )
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND));
    }

    private StudentQuestionResponse generatePersistAndMapQuestion(
            RacePlayer lockedRacePlayer
    ) {
        QuestionPlan questionPlan =
                racePlayerQuestionPlanService.buildQuestionPlan(lockedRacePlayer);

        InternalGeneratedQuestion generatedQuestion =
                questionGenerationService.generate(questionPlan);

        PlayerQuestion persistedQuestion = playerQuestionPersistenceService.persistGeneratedQuestion(
                lockedRacePlayer,
                generatedQuestion
        );

        // A brand-new question made no "still active?" decision — a fresh
        // post-persistence server time is the correct reference.
        return mapToStudentResponse(persistedQuestion, clock.millis());
    }

    private StudentQuestionResponse mapToStudentResponse(
            PlayerQuestion playerQuestion,
            long serverTimeEpochMs
    ) {
        List<PlayerQuestionChoice> choices = playerQuestionChoiceRepository
                .findByPlayerQuestionOrderByDisplayOrderAsc(playerQuestion);

        long expiresAtEpochMs = DateTimeUtils.toEpochMilli(
                playerQuestion.getExpiresAt(),
                clock.getZone()
        );

        return studentQuestionResponseMapper.toResponse(
                playerQuestion,
                choices,
                serverTimeEpochMs,
                expiresAtEpochMs
        );
    }

    private void validateExistingQuestion(PlayerQuestion playerQuestion) {
        if (playerQuestion == null || playerQuestion.getExpiresAt() == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }
}
