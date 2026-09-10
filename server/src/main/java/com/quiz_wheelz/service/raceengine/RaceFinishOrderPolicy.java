package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.service.raceplayer.RaceStandingCalculator;
import com.quiz_wheelz.service.raceplayer.RaceStandingCalculator.RankedRacePlayer;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Component
public class RaceFinishOrderPolicy {

    private final RaceStandingCalculator standingCalculator;
    private final RaceMovementCalculator movementCalculator;

    public RaceFinishOrderPolicy(
            RaceStandingCalculator standingCalculator,
            RaceMovementCalculator movementCalculator
    ) {
        this.standingCalculator = Objects.requireNonNull(standingCalculator);
        this.movementCalculator = Objects.requireNonNull(movementCalculator);
    }

    public FinishOrderProof confirm(
            List<RacePlayer> authoritativePlayers,
            int totalDistance,
            long decisionEpochMs
    ) {
        List<RankedRacePlayer> standings = standingCalculator.calculate(authoritativePlayers);
        long confirmedThroughEpochMs = decisionEpochMs - 1;

        for (RankedRacePlayer standing : standings) {
            RacePlayer racePlayer = standing.racePlayer();

            if (racePlayer.getStatus() == RacePlayerStatus.FINISHED
                    && racePlayer.getFinishedAtEpochMs() == null) {
                return FinishOrderProof.unproven();
            }

            if (racePlayer.getStatus() == RacePlayerStatus.WAITING) {
                return FinishOrderProof.unproven();
            }

            if (racePlayer.getStatus() != RacePlayerStatus.RACING) {
                continue;
            }

            Long anchorEpochMs = racePlayer.getMovementUpdatedAtEpochMs();

            if (anchorEpochMs == null) {
                return FinishOrderProof.unproven();
            }

            long earliestCrossingEpochMs = movementCalculator.earliestCrossingEpochMs(
                    racePlayer.getPosition() == null ? 0.0 : racePlayer.getPosition(),
                    anchorEpochMs,
                    totalDistance,
                    RaceProgressRules.MAX_RACING_SPEED
            );
            confirmedThroughEpochMs = Math.min(
                    confirmedThroughEpochMs,
                    earliestCrossingEpochMs - 1
            );
        }

        List<ConfirmedFinisher> confirmedFinishers = new ArrayList<>();

        for (RankedRacePlayer standing : standings) {
            RacePlayer racePlayer = standing.racePlayer();

            if (racePlayer.getStatus() != RacePlayerStatus.FINISHED) {
                break;
            }

            if (racePlayer.getFinishedAtEpochMs() > confirmedThroughEpochMs) {
                break;
            }

            confirmedFinishers.add(new ConfirmedFinisher(
                    racePlayer.getId(),
                    racePlayer.getFinishedAtEpochMs(),
                    standing.rank()
            ));
        }

        return new FinishOrderProof(confirmedThroughEpochMs, confirmedFinishers);
    }

    public record ConfirmedFinisher(
            Long racePlayerId,
            long finishedAtEpochMs,
            int rank
    ) {
    }

    public record FinishOrderProof(
            Long confirmedThroughEpochMs,
            List<ConfirmedFinisher> confirmedFinishers
    ) {

        public FinishOrderProof {
            confirmedFinishers = List.copyOf(Objects.requireNonNull(confirmedFinishers));
        }

        public static FinishOrderProof unproven() {
            return new FinishOrderProof(null, List.of());
        }
    }
}
