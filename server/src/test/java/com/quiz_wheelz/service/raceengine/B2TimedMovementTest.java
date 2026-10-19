package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.RacePlayerSpeedEffect;
import com.quiz_wheelz.enums.EffectType;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class B2TimedMovementTest {
    private final RaceMovementCalculator ticks = new RaceMovementCalculator();
    private final RaceSpeedEffectMovementCalculator calculator = new RaceSpeedEffectMovementCalculator(ticks);

    @ParameterizedTest
    @CsvSource({"999,3.996,1.0,false", "1000,4.0,1.2,true", "4999,23.1952,1.2,true",
            "5000,23.2,1.0,false", "5001,23.204,1.0,false"})
    void tailwindHasExactFourSecondHalfOpenWindow(long target, double position, double speed, boolean active) {
        var effects = List.of(effect(EffectType.SPEED_BOOST, 1000, 5000, 2));
        assertEquals(position, calculator.project(0, 1, 0, target, 1000, effects).position());
        assertEquals(speed, calculator.effectiveSpeedAt(1, target, effects));
        assertEquals(active ? 1 : 0, calculator.activeSpeedEffects(effects, target).size());
    }

    @ParameterizedTest
    @CsvSource({"999,3.996,1.0,false", "1000,4.0,0.9,true", "3999,14.7964,0.9,true",
            "4000,14.8,1.0,false", "4001,14.804,1.0,false"})
    void mudHasExactThreeSecondHalfOpenWindow(long target, double position, double speed, boolean active) {
        var effects = List.of(effect(EffectType.SPEED_SLOW, 1000, 4000, 1));
        assertEquals(position, calculator.project(0, 1, 0, target, 1000, effects).position());
        assertEquals(speed, calculator.effectiveSpeedAt(1, target, effects));
        assertEquals(active ? 1 : 0, calculator.activeSpeedEffects(effects, target).size());
    }

    @Test
    void zeroOrReversedTimePreservesTheExistingAnchorWithActiveEffects() {
        var effects = List.of(effect(EffectType.SPEED_BOOST, 0, 10000, 2));
        assertEquals(ticks.project(10, 1, 5000, 5000, 1000), calculator.project(10, 1, 5000, 5000, 1000, effects));
        assertEquals(ticks.project(10, 1, 5000, 4000, 1000), calculator.project(10, 1, 5000, 4000, 1000, effects));
    }

    @Test
    void capAndEffectiveMinimumUseTenthsWithoutChangingBaseSpeedRules() {
        var boost = List.of(effect(EffectType.SPEED_BOOST, 0, 4000, 2));
        assertEquals(2.0, calculator.effectiveSpeedAt(1.9, 0, boost));
        assertEquals(2.0, calculator.effectiveSpeedAt(2.0, 0, boost));
        assertEquals(32.0, calculator.project(0, 1.9, 0, 4000, 1000, boost).position());
        var slow = List.of(effect(EffectType.SPEED_SLOW, 0, 3000, Integer.MAX_VALUE));
        assertEquals(0.1, calculator.effectiveSpeedAt(.5, 0, slow));
        assertEquals(1.2, calculator.project(0, .5, 0, 3000, 1000, slow).position());
    }

    @Test
    void unsortedAdjacentMixedEffectsAndGapsHaveOneTimeline() {
        var boost = effect(EffectType.SPEED_BOOST, 1000, 5000, 2);
        var slow = effect(EffectType.SPEED_SLOW, 5000, 8000, 1);
        var adjacent = List.of(slow, boost);
        assertEquals(42.0, calculator.project(0, 1, 0, 10000, 1000, adjacent).position());
        assertEquals(.9, calculator.effectiveSpeedAt(1, 5000, adjacent));
        var gaps = List.of(boost, effect(EffectType.SPEED_SLOW, 6000, 9000, 1));
        assertEquals(42.0, calculator.project(0, 1, 0, 10000, 1000, gaps).position());
        assertEquals(1.0, calculator.effectiveSpeedAt(1, 5000, gaps));
    }

    @Test
    void earliestFinishBeforeDuringAndAtEffectEndStopsTheAnchor() {
        var future = List.of(effect(EffectType.SPEED_BOOST, 1000, 5000, 2));
        assertEquals(500L, calculator.project(998, 1, 0, 9000, 1000, future).finishCrossingEpochMs());
        var boost = List.of(effect(EffectType.SPEED_BOOST, 0, 4000, 2));
        var during = calculator.project(999, 1, 0, 9000, 1000, boost);
        assertEquals(209L, during.finishCrossingEpochMs());
        assertEquals(209L, during.effectiveAtEpochMs());
        assertEquals(1000.0, during.position());
        assertEquals(4000L, calculator.project(980.8, 1, 0, 9000, 1000, boost).finishCrossingEpochMs());
        assertEquals(125L, calculator.project(999, 1.9, 0, 9000, 1000, boost).finishCrossingEpochMs());
    }

    @Test
    void mixedTimelineIsPartitionInvariantAndRespectsMaximumFinishBound() {
        var effects = List.of(effect(EffectType.SPEED_BOOST, 123, 4123, 2),
                effect(EffectType.SPEED_SLOW, 4321, 7321, 1));
        for (int tenths = 5; tenths <= 20; tenths++) {
            double base = tenths / 10.0;
            var whole = calculator.project(950.1234, base, 0, 30000, 1000, effects);
            assertTrue(whole.finishCrossingEpochMs() >= ticks.earliestCrossingEpochMs(950.1234, 0, 1000, 2));
            var split = new RaceMovementCalculator.Projection(950.1234, 0, null);
            for (long target = 37; target < 30037; target += 37) {
                split = calculator.project(split.position(), base, split.effectiveAtEpochMs(),
                        Math.min(target, 30000), 1000, effects);
                if (split.crossedFinish()) break;
            }
            assertEquals(whole, split);
        }
    }

    @Test
    void effectAlreadyStartedBelowEightyPercentContinuesAboveGate() {
        var effects = List.of(effect(EffectType.SPEED_BOOST, 0, 4000, 2));
        assertEquals(818.2, calculator.project(799, 1, 0, 4000, 1000, effects).position());
    }

    @Test
    void historicalOverlapFailsClosedForMovementAndActiveRate() {
        var effects = List.of(effect(EffectType.SPEED_BOOST, 1000, 5000, 2),
                effect(EffectType.SPEED_SLOW, 2000, 6000, 1));
        assertThrows(IllegalStateException.class, () -> calculator.project(0, 1, 0, 7000, 1000, effects));
        assertThrows(IllegalStateException.class, () -> calculator.effectiveSpeedAt(1, 3000, effects));
    }

    private RacePlayerSpeedEffect effect(EffectType type, long start, long end, int magnitude) {
        var effect = new RacePlayerSpeedEffect();
        effect.setType(type);
        effect.setStartsAtEpochMs(start);
        effect.setEndsAtEpochMs(end);
        effect.setMagnitudeTenths(magnitude);
        return effect;
    }
}
