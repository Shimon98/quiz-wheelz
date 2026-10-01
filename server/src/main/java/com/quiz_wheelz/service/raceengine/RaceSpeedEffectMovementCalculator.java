package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.common.RaceSpeedEffectRules;
import com.quiz_wheelz.entitys.RacePlayerSpeedEffect;
import com.quiz_wheelz.enums.EffectType;
import com.quiz_wheelz.service.raceengine.RaceMovementCalculator.Projection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class RaceSpeedEffectMovementCalculator {

    private final RaceMovementCalculator calculator;

    public Projection project(
            double position, double baseSpeed, long anchor, long target,
            int totalDistance, List<RacePlayerSpeedEffect> effects
    ) {
        long cursor = anchor;
        double currentPosition = position;
        for (RacePlayerSpeedEffect effect : effects) {
            if (effect.getType() != EffectType.SPEED_SLOW
                    || effect.getEndsAtEpochMs() <= cursor
                    || effect.getStartsAtEpochMs() >= target) {
                continue;
            }
            long start = Math.max(cursor, effect.getStartsAtEpochMs());
            Projection normal = calculator.project(currentPosition, baseSpeed, cursor, start, totalDistance);
            if (normal.crossedFinish()) {
                return normal;
            }
            long end = Math.min(target, effect.getEndsAtEpochMs());
            Projection slowed = calculator.project(
                    normal.position(), effectiveSpeed(baseSpeed, effect.getMagnitudeTenths()),
                    start, end, totalDistance
            );
            if (slowed.crossedFinish()) {
                return slowed;
            }
            currentPosition = slowed.position();
            cursor = end;
        }
        return calculator.project(currentPosition, baseSpeed, cursor, target, totalDistance);
    }

    private double effectiveSpeed(double baseSpeed, int magnitudeTenths) {
        long baseTenths = Math.round(baseSpeed * RaceMovementCalculator.SPEED_TENTHS_PER_UNIT);
        return Math.max(RaceSpeedEffectRules.MIN_EFFECTIVE_SPEED_TENTHS, baseTenths - magnitudeTenths)
                / (double) RaceMovementCalculator.SPEED_TENTHS_PER_UNIT;
    }
}
