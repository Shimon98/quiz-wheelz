package com.quiz_wheelz.service.question;

import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.dto.question.internal.InternalGeneratedQuestion;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.PlayerQuestionChoice;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionChoiceRepository;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
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
            Clock clock
    ) {
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.playerQuestionChoiceRepository = Objects.requireNonNull(playerQuestionChoiceRepository);
        this.racePlayerQuestionPlanService = Objects.requireNonNull(racePlayerQuestionPlanService);
        this.questionGenerationService = Objects.requireNonNull(questionGenerationService);
        this.playerQuestionPersistenceService = Objects.requireNonNull(playerQuestionPersistenceService);
        this.studentQuestionResponseMapper = Objects.requireNonNull(studentQuestionResponseMapper);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional
    public StudentQuestionResponse getOrCreateCurrentQuestion(RacePlayer racePlayer) {
        RacePlayer lockedRacePlayer = findLockedRacePlayer(racePlayer);

        Optional<PlayerQuestion> active = playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        lockedRacePlayer,
                        PlayerQuestionStatus.ACTIVE
                );

        if (active.isPresent()) {
            PlayerQuestion activeQuestion = active.get();
            validateExistingQuestion(activeQuestion);

            if (!isExpired(activeQuestion)) {
                return mapToStudentResponse(activeQuestion);
            }

            expireQuestion(activeQuestion);
        }

        return generatePersistAndMapQuestion(lockedRacePlayer);
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

        return mapToStudentResponse(persistedQuestion);
    }

    private StudentQuestionResponse mapToStudentResponse(
            PlayerQuestion playerQuestion
    ) {
        List<PlayerQuestionChoice> choices = playerQuestionChoiceRepository
                .findByPlayerQuestionOrderByDisplayOrderAsc(playerQuestion);

        long serverTimeEpochMs = clock.millis();

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

    private void expireQuestion(PlayerQuestion playerQuestion) {
        playerQuestion.setStatus(PlayerQuestionStatus.EXPIRED);
        playerQuestionRepository.save(playerQuestion);
    }

    private boolean isExpired(PlayerQuestion playerQuestion) {
        return DateTimeUtils.isExpired(
                playerQuestion.getExpiresAt(),
                LocalDateTime.now(clock)
        );
    }

    private void validateExistingQuestion(PlayerQuestion playerQuestion) {
        if (playerQuestion == null || playerQuestion.getExpiresAt() == null) {
            throw new ApiException(ErrorCode.INVALID_QUESTION_TEMPLATE_CONFIG);
        }
    }
}
