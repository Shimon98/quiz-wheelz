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
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayRequestGuard;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class StudentQuestionDeliveryService {

    private final RacePlayerRepository racePlayerRepository;
    private final PlayerQuestionRepository playerQuestionRepository;
    private final PlayerQuestionChoiceRepository playerQuestionChoiceRepository;
    private final RacePlayerQuestionPlanService racePlayerQuestionPlanService;
    private final QuestionGenerationService questionGenerationService;
    private final PlayerQuestionPersistenceService playerQuestionPersistenceService;
    private final StudentQuestionResponseMapper studentQuestionResponseMapper;
    private final RacePlayerGameplayRequestGuard gameplayRequestGuard;
    private final Clock clock;

    public StudentQuestionDeliveryService(
            RacePlayerRepository racePlayerRepository,
            PlayerQuestionRepository playerQuestionRepository,
            PlayerQuestionChoiceRepository playerQuestionChoiceRepository,
            RacePlayerQuestionPlanService racePlayerQuestionPlanService,
            QuestionGenerationService questionGenerationService,
            PlayerQuestionPersistenceService playerQuestionPersistenceService,
            StudentQuestionResponseMapper studentQuestionResponseMapper,
            RacePlayerGameplayRequestGuard gameplayRequestGuard,
            Clock clock
    ) {
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.playerQuestionChoiceRepository = Objects.requireNonNull(playerQuestionChoiceRepository);
        this.racePlayerQuestionPlanService = Objects.requireNonNull(racePlayerQuestionPlanService);
        this.questionGenerationService = Objects.requireNonNull(questionGenerationService);
        this.playerQuestionPersistenceService = Objects.requireNonNull(playerQuestionPersistenceService);
        this.studentQuestionResponseMapper = Objects.requireNonNull(studentQuestionResponseMapper);
        this.gameplayRequestGuard = Objects.requireNonNull(gameplayRequestGuard);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public StudentQuestionResponse getOrCreateCurrentQuestion(RacePlayer racePlayer) {
        RacePlayer lockedRacePlayer = findLockedRacePlayer(racePlayer);

        Instant decisionInstant = clock.instant();
        long decisionEpochMs = decisionInstant.toEpochMilli();

        gameplayRequestGuard.requireGameplayAccess(
                lockedRacePlayer,
                decisionInstant
        );
        validateLockedRacePlayerCanReceiveQuestion(lockedRacePlayer);

        Optional<PlayerQuestion> active = playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        lockedRacePlayer,
                        PlayerQuestionStatus.ACTIVE
                );

        if (active.isPresent()) {
            PlayerQuestion activeQuestion = active.get();
            validateExistingQuestion(activeQuestion);
            return mapToStudentResponse(activeQuestion, decisionEpochMs);
        }

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
