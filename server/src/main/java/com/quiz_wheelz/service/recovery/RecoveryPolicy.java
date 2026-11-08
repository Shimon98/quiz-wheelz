package com.quiz_wheelz.service.recovery;

import com.quiz_wheelz.common.ChallengeRules;
import com.quiz_wheelz.common.RecoveryRules;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class RecoveryPolicy {
    private static final int WINDOW_MASK = (1 << RecoveryRules.OUTCOME_WINDOW) - 1;
    private static final BigDecimal TWO = BigDecimal.valueOf(2);

    public int appendOutcome(int bits, boolean correct) {
        return ((bits << 1) | (correct ? 1 : 0)) & WINDOW_MASK;
    }

    public int nextCount(int count) {
        return Math.min(RecoveryRules.OUTCOME_WINDOW, Math.max(0, count) + 1);
    }

    public int failures(int bits, int count) {
        return count - Integer.bitCount(bits & ((1 << count) - 1));
    }

    public boolean struggling(int bits, int count) {
        return count == RecoveryRules.OUTCOME_WINDOW && failures(bits, count) >= RecoveryRules.MIN_FAILURES;
    }

    public boolean hasRoomForNudge(int energyAfterNormalGain) {
        return energyAfterNormalGain >= 0
                && energyAfterNormalGain <= ChallengeRules.ENERGY_THRESHOLD - RecoveryRules.NUDGE_ENERGY;
    }

    public Optional<RecoveryStanding> standing(double totalDistance, double self, List<Double> peers) {
        if (!Double.isFinite(totalDistance) || totalDistance <= 0 || !Double.isFinite(self)
                || peers.stream().anyMatch(position -> position == null || !Double.isFinite(position))) {
            return Optional.empty();
        }
        List<BigDecimal> positions = new ArrayList<>(peers.stream().map(BigDecimal::valueOf).toList());
        positions.add(BigDecimal.valueOf(self));
        positions.sort(BigDecimal::compareTo);
        int count = positions.size();
        // Halving always terminates, so the median stays exact at the 6% boundary.
        BigDecimal median = count % 2 == 1 ? positions.get(count / 2)
                : positions.get(count / 2 - 1).add(positions.get(count / 2)).divide(TWO);
        return Optional.of(new RecoveryStanding(BigDecimal.valueOf(totalDistance), BigDecimal.valueOf(self),
                positions.get(count - 1), median, count));
    }

    public boolean behind(RecoveryStanding standing) {
        var total = standing.totalDistance();
        return standing.racingPlayers() >= RecoveryRules.MIN_RACING_PLAYERS
                && standing.self().compareTo(total.multiply(RecoveryRules.MAX_PROGRESS_RATIO)) <= 0
                && standing.leader().subtract(standing.self())
                .compareTo(total.multiply(RecoveryRules.MIN_LEADER_GAP_RATIO)) >= 0
                && standing.median().subtract(standing.self())
                .compareTo(total.multiply(RecoveryRules.MIN_MEDIAN_GAP_RATIO)) >= 0;
    }
}
