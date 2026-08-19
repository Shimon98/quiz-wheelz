package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Per-item transactional work for the movement settlement sweep (C1-03M) —
 * a SEPARATE bean from the scheduler so @Transactional is never
 * self-invoked, and one player/race per transaction so a single failure or
 * lock wait never blocks the whole sweep.
 */
@Service
public class RaceMovementSettlementWorker {

    private final RacePlayerRepository racePlayerRepository;
    private final RaceRepository raceRepository;
    private final QuestionTimeoutService questionTimeoutService;
    private final RaceFinishService raceFinishService;
    private final Clock clock;

    public RaceMovementSettlementWorker(
            RacePlayerRepository racePlayerRepository,
            RaceRepository raceRepository,
            QuestionTimeoutService questionTimeoutService,
            RaceFinishService raceFinishService,
            Clock clock
    ) {
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.raceRepository = Objects.requireNonNull(raceRepository);
        this.questionTimeoutService = Objects.requireNonNull(questionTimeoutService);
        this.raceFinishService = Objects.requireNonNull(raceFinishService);
        this.clock = Objects.requireNonNull(clock);
    }

    /*
     * Movement and overdue timeouts must not depend on client requests: a
     * child who never touches the phone still progresses, still gets the
     * timeout slowdown, and still finishes. The next question is NOT
     * generated here — that stays a current-question resolve concern.
     */
    @Transactional
    public void settlePlayer(Long racePlayerId, Long raceId) {
        RacePlayer racePlayer = racePlayerRepository
                .findLockedByIdAndRaceId(racePlayerId, raceId)
                .orElse(null);

        // Re-validate on the LOCKED row — the candidate list was unlocked.
        if (racePlayer == null
                || racePlayer.getStatus() != RacePlayerStatus.RACING
                || racePlayer.getRace() == null
                || racePlayer.getRace().getStatus() != RaceStatus.IN_PROGRESS) {
            return;
        }

        Instant decisionInstant = clock.instant();
        LocalDateTime decisionNow =
                DateTimeUtils.toLocalDateTime(decisionInstant, clock.getZone());

        questionTimeoutService.settleWithOverdueTimeout(
                racePlayer,
                decisionNow,
                decisionInstant.toEpochMilli()
        );
    }

    /*
     * Race-finish reconciliation: the authoritative re-check happens under
     * the race lock, so concurrent player finishes can never strand a race
     * IN_PROGRESS forever.
     */
    @Transactional
    public void finalizeRaceIfComplete(Long raceId) {
        Race race = raceRepository.findLockedById(raceId).orElse(null);

        if (race == null) {
            return;
        }

        raceFinishService.finishRaceIfNeeded(race);
    }
}
