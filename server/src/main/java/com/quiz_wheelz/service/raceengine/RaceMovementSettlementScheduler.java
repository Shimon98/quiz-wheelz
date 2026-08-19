package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

/**
 * Safety settlement sweep (C1-03M): guarantees continuous authoritative
 * movement, overdue timeouts, and eventual race finish even when NO client
 * request arrives. Low frequency by design — not a game loop; the advancing
 * movement anchor plus per-player locks make overlap with requests (or a
 * second dev server instance) idempotent.
 */
@Component
public class RaceMovementSettlementScheduler {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(RaceMovementSettlementScheduler.class);

    private final RacePlayerRepository racePlayerRepository;
    private final RaceRepository raceRepository;
    private final RaceMovementSettlementWorker worker;

    public RaceMovementSettlementScheduler(
            RacePlayerRepository racePlayerRepository,
            RaceRepository raceRepository,
            RaceMovementSettlementWorker worker
    ) {
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.raceRepository = Objects.requireNonNull(raceRepository);
        this.worker = Objects.requireNonNull(worker);
    }

    @Scheduled(fixedDelay = RaceProgressRules.MOVEMENT_SETTLEMENT_INTERVAL_MS)
    public void runSettlementSweep() {
        for (RacePlayerRepository.RacePlayerMovementCandidate candidate
                : racePlayerRepository.findMovementSettlementCandidates(
                        RacePlayerStatus.RACING,
                        RaceStatus.IN_PROGRESS
                )) {
            try {
                worker.settlePlayer(candidate.getPlayerId(), candidate.getRaceId());
            } catch (Exception exception) {
                LOGGER.warn(
                        "Movement settlement failed for racePlayerId={} raceId={}",
                        candidate.getPlayerId(),
                        candidate.getRaceId(),
                        exception
                );
            }
        }

        // Reconciliation pass: once no player is WAITING/RACING anymore, the
        // per-answer finish check has no future trigger — this one does.
        List<Long> finishableRaceIds = raceRepository.findRaceIdsWithoutPlayersInStatuses(
                RaceStatus.IN_PROGRESS,
                List.of(RacePlayerStatus.WAITING, RacePlayerStatus.RACING)
        );

        for (Long raceId : finishableRaceIds) {
            try {
                worker.finalizeRaceIfComplete(raceId);
            } catch (Exception exception) {
                LOGGER.warn("Race finish reconciliation failed for raceId={}", raceId, exception);
            }
        }
    }
}
