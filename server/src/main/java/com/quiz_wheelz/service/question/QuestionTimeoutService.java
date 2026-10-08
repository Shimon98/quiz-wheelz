package com.quiz_wheelz.service.question;

import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.enums.QuestionGameplayContext;
import com.quiz_wheelz.service.challenge.ChallengeExecutionService;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.service.raceengine.RaceEngineService;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.util.Objects;
import java.util.Optional;

@Service
public class QuestionTimeoutService {

    private final RaceMovementService raceMovementService;
    private final RaceEngineService raceEngineService;
    private final PlayerQuestionRepository playerQuestionRepository;
    private final Clock clock;
    private final ChallengeExecutionService challenges;

    public QuestionTimeoutService(
            RaceMovementService raceMovementService,
            RaceEngineService raceEngineService,
            PlayerQuestionRepository playerQuestionRepository,
            Clock clock,
            ChallengeExecutionService challenges
    ) {
        this.raceMovementService = Objects.requireNonNull(raceMovementService);
        this.raceEngineService = Objects.requireNonNull(raceEngineService);
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.clock = Objects.requireNonNull(clock);
        this.challenges = Objects.requireNonNull(challenges);
    }

    public void processExpiredActiveQuestion(
            RacePlayer lockedRacePlayer,
            PlayerQuestion question,
            long decisionEpochMs
    ) {
        processExpiredActiveQuestion(
                lockedRacePlayer,
                question,
                decisionEpochMs,
                decisionEpochMs
        );
    }

    public void processExpiredActiveQuestion(
            RacePlayer lockedRacePlayer,
            PlayerQuestion question,
            long decisionEpochMs,
            long movementCutoffEpochMs
    ) {
        if (question == null || question.getStatus() != PlayerQuestionStatus.ACTIVE) {
            return;
        }

        challenges.validate(lockedRacePlayer, question);
        long expiryEpochMs = expiryEpochMs(question);

        if (question.getGameplayContext() != QuestionGameplayContext.NORMAL) {
            applyTimeoutConsequence(lockedRacePlayer, question, expiryEpochMs,
                    Math.min(decisionEpochMs, movementCutoffEpochMs));
            return;
        }

        if (movementCutoffEpochMs < expiryEpochMs) {
            raceMovementService.settleTo(lockedRacePlayer, movementCutoffEpochMs);
            return;
        }

        applyTimeoutConsequence(
                lockedRacePlayer,
                question,
                expiryEpochMs,
                Math.min(decisionEpochMs, movementCutoffEpochMs)
        );
    }

    public void forfeitActiveQuestionAsTimeout(
            RacePlayer lockedRacePlayer,
            PlayerQuestion question,
            long decisionEpochMs,
            long movementCutoffEpochMs
    ) {
        if (question == null || question.getStatus() != PlayerQuestionStatus.ACTIVE) {
            throw new ApiException(ErrorCode.QUESTION_NOT_ACTIVE);
        }

        challenges.validate(lockedRacePlayer, question);
        long trustedConsequenceEpochMs = Math.min(
                decisionEpochMs,
                movementCutoffEpochMs
        );

        applyTimeoutConsequence(
                lockedRacePlayer,
                question,
                trustedConsequenceEpochMs,
                trustedConsequenceEpochMs
        );
    }

    public void settleWithOverdueTimeout(
            RacePlayer lockedRacePlayer,
            long decisionEpochMs,
            long movementCutoffEpochMs
    ) {
        Optional<PlayerQuestion> activeQuestion = findActiveQuestion(lockedRacePlayer);

        if (activeQuestion.isPresent()
                && expiryEpochMs(activeQuestion.get()) <= (activeQuestion.get().getGameplayContext() == QuestionGameplayContext.NORMAL
                    ? movementCutoffEpochMs : decisionEpochMs)) {
            processExpiredActiveQuestion(
                    lockedRacePlayer,
                    activeQuestion.get(),
                    decisionEpochMs,
                    movementCutoffEpochMs
            );
            return;
        }

        raceMovementService.settleTo(lockedRacePlayer, movementCutoffEpochMs);
    }

    public void expireActiveQuestionWithoutConsequence(RacePlayer terminalRacePlayer) {
        findActiveQuestion(terminalRacePlayer).ifPresent(question -> {
            question.setStatus(PlayerQuestionStatus.EXPIRED);
            playerQuestionRepository.save(question);
        });
    }

    private void applyTimeoutConsequence(
            RacePlayer lockedRacePlayer,
            PlayerQuestion question,
            long movementBeforeConsequenceEpochMs,
            long movementAfterConsequenceEpochMs
    ) {
        raceMovementService.settleTo(
                lockedRacePlayer,
                Math.min(movementBeforeConsequenceEpochMs, movementAfterConsequenceEpochMs)
        );

        question.setStatus(PlayerQuestionStatus.EXPIRED);
        playerQuestionRepository.save(question);

        if (isActivelyRacing(lockedRacePlayer)) {
            if (question.getGameplayContext() == QuestionGameplayContext.NORMAL) {
                raceEngineService.applyTimeoutResult(lockedRacePlayer);
            } else {
                challenges.resolve(lockedRacePlayer, question, false, movementBeforeConsequenceEpochMs);
            }
        }

        raceMovementService.settleTo(
                lockedRacePlayer,
                movementAfterConsequenceEpochMs
        );
    }

    private Optional<PlayerQuestion> findActiveQuestion(RacePlayer racePlayer) {
        return playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        racePlayer,
                        PlayerQuestionStatus.ACTIVE
                );
    }

    private long expiryEpochMs(PlayerQuestion question) {
        return DateTimeUtils.toEpochMilli(question.getExpiresAt(), clock.getZone());
    }

    private boolean isActivelyRacing(RacePlayer racePlayer) {
        Race race = racePlayer.getRace();

        return racePlayer.getStatus() == RacePlayerStatus.RACING
                && race != null
                && race.getStatus() == RaceStatus.IN_PROGRESS;
    }
}
