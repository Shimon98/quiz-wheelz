package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.service.raceengine.RaceMovementCalculator.Projection;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RaceMovementCalculatorTest {

    private static final long ANCHOR = 1_790_000_010_000L;
    private static final int TOTAL_DISTANCE = 1000;

    private final RaceMovementCalculator calculator = new RaceMovementCalculator();

    @Test
    void ordinaryMovementAdvancesBySpeedTimesBaseRate() {
        Projection projection = calculator.project(400.0, 1.5, ANCHOR, ANCHOR + 2_000, TOTAL_DISTANCE);

        assertEquals(412.0, projection.position());
        assertEquals(ANCHOR + 2_000, projection.effectiveAtEpochMs());
        assertFalse(projection.crossedFinish());
    }

    @Test
    void targetEqualToAnchorDoesNotMove() {
        Projection projection = calculator.project(400.0, 1.5, ANCHOR, ANCHOR, TOTAL_DISTANCE);

        assertEquals(400.0, projection.position());
        assertEquals(ANCHOR, projection.effectiveAtEpochMs());
        assertNull(projection.finishCrossingEpochMs());
    }

    @Test
    void targetBeforeAnchorNeverMovesBackward() {
        Projection projection = calculator.project(400.0, 1.5, ANCHOR, ANCHOR - 5_000, TOTAL_DISTANCE);

        assertEquals(400.0, projection.position());
        assertEquals(ANCHOR, projection.effectiveAtEpochMs());
        assertFalse(projection.crossedFinish());
    }

    @Test
    void zeroOrNegativeSpeedAdvancesTheAnchorWithoutMovementOrCrossing() {
        Projection zero = calculator.project(999.0, 0.0, ANCHOR, ANCHOR + 60_000, TOTAL_DISTANCE);
        Projection negative = calculator.project(999.0, -1.0, ANCHOR, ANCHOR + 60_000, TOTAL_DISTANCE);

        assertEquals(999.0, zero.position());
        assertEquals(ANCHOR + 60_000, zero.effectiveAtEpochMs());
        assertFalse(zero.crossedFinish());
        assertEquals(999.0, negative.position());
        assertFalse(negative.crossedFinish());
    }

    @Test
    void exactFinishReportsCrossingAtTheMathematicalInstant() {
        Projection projection = calculator.project(994.0, 2.0, ANCHOR, ANCHOR + 750, TOTAL_DISTANCE);

        assertTrue(projection.crossedFinish());
        assertEquals(ANCHOR + 750, projection.finishCrossingEpochMs());
        assertEquals(ANCHOR + 750, projection.effectiveAtEpochMs());
        assertEquals(1000.0, projection.position());
    }

    @Test
    void oneMillisecondBeforeCrossingStaysShortOfTheFinish() {
        Projection projection = calculator.project(994.0, 2.0, ANCHOR, ANCHOR + 749, TOTAL_DISTANCE);

        assertFalse(projection.crossedFinish());
        assertEquals(999.992, projection.position(), 1e-12);
        assertEquals(ANCHOR + 749, projection.effectiveAtEpochMs());
    }

    @Test
    void lateDiscoveryKeepsTheTrueCrossingInstantNotTheTarget() {
        Projection projection = calculator.project(994.0, 2.0, ANCHOR, ANCHOR + 4_000, TOTAL_DISTANCE);

        assertEquals(ANCHOR + 750, projection.finishCrossingEpochMs());
        assertEquals(ANCHOR + 750, projection.effectiveAtEpochMs());
        assertEquals(1000.0, projection.position());
    }

    @Test
    void ceilNeverReportsACrossingEarlierThanMathematicallyPossible() {
        Projection projection = calculator.project(994.0, 1.5, ANCHOR, ANCHOR + 5_000, TOTAL_DISTANCE);

        assertEquals(ANCHOR + 1_000, projection.finishCrossingEpochMs());
        Projection justBefore = calculator.project(994.0, 1.5, ANCHOR, ANCHOR + 999, TOTAL_DISTANCE);
        assertFalse(justBefore.crossedFinish());
    }

    @Test
    void partitionedSettlementReachesTheSameCrossingAsOneSegment() {
        long single = calculator.project(994.0, 2.0, ANCHOR, ANCHOR + 750, TOTAL_DISTANCE)
                .finishCrossingEpochMs();

        assertEquals(single, crossingAfterSegments(994.0, 2.0, List.of(100L, 100L, 100L, 100L, 100L, 100L, 100L, 50L)));
        assertEquals(single, crossingAfterSegments(994.0, 2.0, java.util.Collections.nCopies(750, 1L)));
    }

    @Test
    void savedPositionRoundTripsThroughDoubleWithoutDrift() {
        double position = 0.0;
        long anchor = ANCHOR;

        for (int step = 0; step < 10_000; step++) {
            Projection projection = calculator.project(position, 0.7, anchor, anchor + 7, TOTAL_DISTANCE);
            position = Double.parseDouble(Double.toString(projection.position()));
            anchor = projection.effectiveAtEpochMs();
        }

        long expectedTicks = 10_000L * 7L * calculator.ticksPerMs(0.7);
        assertEquals(expectedTicks, calculator.positionTicks(position));
        assertEquals(expectedTicks / 10_000.0, position, 0.0);
    }

    @Test
    void maximumAndMinimumRacingSpeedsUseExactTickRates() {
        assertEquals(80L, calculator.ticksPerMs(RaceProgressRules.MAX_RACING_SPEED));
        assertEquals(20L, calculator.ticksPerMs(RaceProgressRules.MIN_RACING_SPEED));
        assertEquals(1000.0, calculator.project(0.0, RaceProgressRules.MIN_RACING_SPEED, ANCHOR, ANCHOR + 500_000, TOTAL_DISTANCE).position());
        assertEquals(ANCHOR + 500_000, calculator.project(0.0, RaceProgressRules.MIN_RACING_SPEED, ANCHOR, ANCHOR + 600_000, TOTAL_DISTANCE).finishCrossingEpochMs());
    }

    @Test
    void nonFiniteInputsAreTreatedAsZero() {
        Projection nanSpeed = calculator.project(500.0, Double.NaN, ANCHOR, ANCHOR + 1_000, TOTAL_DISTANCE);
        Projection infinitePosition = calculator.project(Double.POSITIVE_INFINITY, 1.0, ANCHOR, ANCHOR + 1_000, TOTAL_DISTANCE);

        assertEquals(500.0, nanSpeed.position());
        assertFalse(nanSpeed.crossedFinish());
        assertEquals(4.0, infinitePosition.position());
    }

    @Test
    void positionAtOrBeyondFinishProjectsWithoutCrossingAndClamps() {
        Projection atFinish = calculator.project(1000.0, 2.0, ANCHOR, ANCHOR + 1_000, TOTAL_DISTANCE);

        assertEquals(1000.0, atFinish.position());
        assertFalse(atFinish.crossedFinish());
        assertEquals(ANCHOR, calculator.earliestCrossingEpochMs(1000.0, ANCHOR, TOTAL_DISTANCE, 2.0));
    }

    @Test
    void earliestCrossingBoundUsesCeilDivisionAndMaximumSpeed() {
        assertEquals(ANCHOR + 750, calculator.earliestCrossingEpochMs(994.0, ANCHOR, TOTAL_DISTANCE, 2.0));
        assertEquals(ANCHOR + 1, calculator.earliestCrossingEpochMs(999.9999, ANCHOR, TOTAL_DISTANCE, 2.0));
        assertEquals(Long.MAX_VALUE, calculator.earliestCrossingEpochMs(500.0, ANCHOR, TOTAL_DISTANCE, 0.0));
    }

    private long crossingAfterSegments(double position, double speed, List<Long> segmentsMs) {
        long anchor = ANCHOR;
        Projection projection = null;

        for (long segment : segmentsMs) {
            projection = calculator.project(position, speed, anchor, anchor + segment, TOTAL_DISTANCE);
            position = Double.parseDouble(Double.toString(projection.position()));
            anchor = projection.effectiveAtEpochMs();
            if (projection.crossedFinish()) {
                return projection.finishCrossingEpochMs();
            }
        }

        throw new AssertionError("never crossed: " + projection);
    }
}
