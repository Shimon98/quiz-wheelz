package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.common.RaceProgressRules;
import org.springframework.stereotype.Component;

@Component
public class RaceMovementCalculator {

    static final long POSITION_TICKS_PER_UNIT = 10_000L;
    static final long SPEED_TENTHS_PER_UNIT = 10L;

    private static final long BASE_MOVEMENT_UNITS_PER_SECOND =
            Math.round(RaceProgressRules.BASE_MOVEMENT_UNITS_PER_SECOND);

    public Projection project(
            double position,
            double speed,
            long anchorEpochMs,
            long targetEpochMs,
            int totalDistance
    ) {
        long positionTicks = positionTicks(position);
        long finishTicks = positionTicks(totalDistance);

        if (targetEpochMs <= anchorEpochMs) {
            return new Projection(toPosition(positionTicks), anchorEpochMs, null);
        }

        long ticksPerMs = ticksPerMs(speed);

        if (ticksPerMs <= 0 || positionTicks >= finishTicks) {
            return new Projection(toPosition(positionTicks), targetEpochMs, null);
        }

        long remainingTicks = finishTicks - positionTicks;
        long crossingDeltaMs = ceilDiv(remainingTicks, ticksPerMs);
        long elapsedMs = targetEpochMs - anchorEpochMs;

        if (elapsedMs >= crossingDeltaMs) {
            long crossingEpochMs = anchorEpochMs + crossingDeltaMs;
            return new Projection(totalDistance, crossingEpochMs, crossingEpochMs);
        }

        long movedTicks = positionTicks + elapsedMs * ticksPerMs;
        return new Projection(toPosition(movedTicks), targetEpochMs, null);
    }

    public long earliestCrossingEpochMs(
            double position,
            long anchorEpochMs,
            int totalDistance,
            double speed
    ) {
        long remainingTicks = positionTicks(totalDistance) - positionTicks(position);
        long ticksPerMs = ticksPerMs(speed);

        if (remainingTicks <= 0) {
            return anchorEpochMs;
        }

        if (ticksPerMs <= 0) {
            return Long.MAX_VALUE;
        }

        return anchorEpochMs + ceilDiv(remainingTicks, ticksPerMs);
    }

    public long positionTicks(double position) {
        return Math.max(0L, Math.round(finite(position) * POSITION_TICKS_PER_UNIT));
    }

    public long ticksPerMs(double speed) {
        long speedTenths = Math.max(0L, Math.round(finite(speed) * SPEED_TENTHS_PER_UNIT));
        return BASE_MOVEMENT_UNITS_PER_SECOND * speedTenths;
    }

    private double toPosition(long positionTicks) {
        return positionTicks / (double) POSITION_TICKS_PER_UNIT;
    }

    private double finite(double value) {
        return Double.isFinite(value) ? value : 0.0;
    }

    private long ceilDiv(long numerator, long denominator) {
        return Math.ceilDiv(numerator, denominator);
    }

    public record Projection(
            double position,
            long effectiveAtEpochMs,
            Long finishCrossingEpochMs
    ) {

        public boolean crossedFinish() {
            return finishCrossingEpochMs != null;
        }
    }
}
