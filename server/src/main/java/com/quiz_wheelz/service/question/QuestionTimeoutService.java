package com.quiz_wheelz.service.question;

import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.service.raceengine.RaceEngineService;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Service
public class QuestionTimeoutService {

    private final RaceMovementService raceMovementService;
    private final RaceEngineService raceEngineService;
    private final PlayerQuestionRepository playerQuestionRepository;
    private final Clock clock;

    public QuestionTimeoutService(
            RaceMovementService raceMovementService,
            RaceEngineService raceEngineService,
            PlayerQuestionRepository playerQuestionRepository,
            Clock clock
    ) {
        this.raceMovementService = Objects.requireNonNull(raceMovementService);
        this.raceEngineService = Objects.requireNonNull(raceEngineService);
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.clock = Objects.requireNonNull(clock);
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

        long expiryEpochMs = DateTimeUtils.toEpochMilli(
                question.getExpiresAt(),
                clock.getZone()
        );

        raceMovementService.settleTo(
                lockedRacePlayer,
                Math.min(expiryEpochMs, movementCutoffEpochMs)
        );

        question.setStatus(PlayerQuestionStatus.EXPIRED);
        playerQuestionRepository.save(question);

        if (isActivelyRacing(lockedRacePlayer)) {
            raceEngineService.applyTimeoutResult(lockedRacePlayer);
        }

        raceMovementService.settleTo(
                lockedRacePlayer,
                Math.min(decisionEpochMs, movementCutoffEpochMs)
        );
    }

    public void settleWithOverdueTimeout(
            RacePlayer lockedRacePlayer,
            LocalDateTime decisionNow,
            long decisionEpochMs
    ) {
        settleWithOverdueTimeout(
                lockedRacePlayer,
                decisionNow,
                decisionEpochMs,
                decisionEpochMs
        );
    }

    public void settleWithOverdueTimeout(
            RacePlayer lockedRacePlayer,
            LocalDateTime decisionNow,
            long decisionEpochMs,
            long movementCutoffEpochMs
    ) {
        Optional<PlayerQuestion> activeQuestion = playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        lockedRacePlayer,
                        PlayerQuestionStatus.ACTIVE
                );

        if (activeQuestion.isPresent()
                && DateTimeUtils.isExpired(
                        activeQuestion.get().getExpiresAt(),
                        decisionNow
                )) {
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

    private boolean isActivelyRacing(RacePlayer racePlayer) {
        Race race = racePlayer.getRace();

        return racePlayer.getStatus() == RacePlayerStatus.RACING
                && race != null
                && race.getStatus() == RaceStatus.IN_PROGRESS;
    }
}
