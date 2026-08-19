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

/**
 * The ONE owner of timeout gameplay (C1-03M). Every path that can discover
 * an expired ACTIVE question — current-question resolve, a late answer
 * submission, race-state settlement and the safety scheduler — routes here,
 * so the penalty can never be applied twice: callers hold the RacePlayer
 * lock, and the ACTIVE→EXPIRED transition is the exactly-once gate.
 *
 * Chronology: the pre-timeout speed owns time up to the deadline, the
 * penalized speed owns everything after it (never settle the whole interval
 * at the old speed and then penalize).
 */
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
        if (question == null || question.getStatus() != PlayerQuestionStatus.ACTIVE) {
            // Already processed by an earlier discoverer — exactly once.
            return;
        }

        long expiryEpochMs = DateTimeUtils.toEpochMilli(
                question.getExpiresAt(),
                clock.getZone()
        );

        // The pre-timeout speed owns the interval up to the deadline. This
        // settlement itself may cross the finish line — then FINISHED wins
        // and no penalty applies.
        raceMovementService.settleTo(lockedRacePlayer, expiryEpochMs);

        question.setStatus(PlayerQuestionStatus.EXPIRED);
        playerQuestionRepository.save(question);

        if (isActivelyRacing(lockedRacePlayer)) {
            raceEngineService.applyTimeoutResult(lockedRacePlayer);
        }

        // The penalized speed owns the time after the deadline.
        raceMovementService.settleTo(lockedRacePlayer, decisionEpochMs);
    }

    /**
     * Shared settlement orchestration for touchpoints that only need "bring
     * this player's movement to now, honoring an overdue timeout first"
     * (race-state reads, the safety scheduler).
     */
    public void settleWithOverdueTimeout(
            RacePlayer lockedRacePlayer,
            LocalDateTime decisionNow,
            long decisionEpochMs
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
                    decisionEpochMs
            );
            return;
        }

        raceMovementService.settleTo(lockedRacePlayer, decisionEpochMs);
    }

    private boolean isActivelyRacing(RacePlayer racePlayer) {
        Race race = racePlayer.getRace();

        return racePlayer.getStatus() == RacePlayerStatus.RACING
                && race != null
                && race.getStatus() == RaceStatus.IN_PROGRESS;
    }
}
