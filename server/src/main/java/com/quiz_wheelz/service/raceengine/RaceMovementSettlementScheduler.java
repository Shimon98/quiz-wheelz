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
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.Objects;

@Component
public class RaceMovementSettlementScheduler {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(RaceMovementSettlementScheduler.class);
    private static final String PLAYER_SETTLEMENT_FAILURE_LOG =
            "Movement settlement failed for racePlayerId={} raceId={}";
    private static final String RACE_FINALIZATION_FAILURE_LOG =
            "Race finish reconciliation failed for raceId={}";

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
        List<RacePlayerRepository.RacePlayerMovementCandidate> candidates =
                racePlayerRepository.findMovementSettlementCandidates(
                        RacePlayerStatus.RACING,
                        RaceStatus.IN_PROGRESS
                );
        Set<Long> raceIdsToReconcile = new LinkedHashSet<>();

        for (RacePlayerRepository.RacePlayerMovementCandidate candidate : candidates) {
            raceIdsToReconcile.add(candidate.getRaceId());
            try {
                worker.settlePlayer(candidate.getPlayerId(), candidate.getRaceId());
            } catch (Exception exception) {
                LOGGER.warn(
                        PLAYER_SETTLEMENT_FAILURE_LOG,
                        candidate.getPlayerId(),
                        candidate.getRaceId(),
                        exception
                );
            }
        }

        raceIdsToReconcile.addAll(
                raceRepository.findRaceIdsWithoutPlayersInStatuses(
                        RaceStatus.IN_PROGRESS,
                        List.of(RacePlayerStatus.WAITING, RacePlayerStatus.RACING)
                )
        );

        for (Long raceId : raceIdsToReconcile) {
            try {
                worker.finalizeRaceIfComplete(raceId);
            } catch (Exception exception) {
                LOGGER.warn(RACE_FINALIZATION_FAILURE_LOG, raceId, exception);
            }
        }
    }
}
