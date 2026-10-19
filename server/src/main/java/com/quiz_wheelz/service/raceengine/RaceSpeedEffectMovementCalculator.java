package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.common.RaceSpeedEffectRules;
import com.quiz_wheelz.common.RaceProgressRules;
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
        var ordered = orderedSpeedEffects(effects);
        if (target <= anchor) {
            return calculator.project(position, baseSpeed, anchor, target, totalDistance);
        }
        long cursor = anchor;
        double currentPosition = position;
        for (RacePlayerSpeedEffect effect : ordered) {
            if (effect.getEndsAtEpochMs() <= cursor
                    || effect.getStartsAtEpochMs() >= target) {
                continue;
            }
            long start = Math.max(cursor, effect.getStartsAtEpochMs());
            Projection normal = calculator.project(currentPosition, baseSpeed, cursor, start, totalDistance);
            if (normal.crossedFinish()) {
                return normal;
            }
            long end = Math.min(target, effect.getEndsAtEpochMs());
            Projection affected = calculator.project(
                    normal.position(), effectiveSpeed(baseSpeed, effect),
                    start, end, totalDistance
            );
            if (affected.crossedFinish()) {
                return affected;
            }
            currentPosition = affected.position();
            cursor = end;
        }
        return calculator.project(currentPosition, baseSpeed, cursor, target, totalDistance);
    }

    public List<RacePlayerSpeedEffect> activeSpeedEffects(List<RacePlayerSpeedEffect> effects, long instant) {
        return orderedSpeedEffects(effects).stream()
                .filter(effect -> effect.getStartsAtEpochMs() <= instant && instant < effect.getEndsAtEpochMs())
                .toList();
    }

    public double effectiveSpeedAt(double baseSpeed, long instant, List<RacePlayerSpeedEffect> effects) {
        return activeSpeedEffects(effects, instant).stream().findFirst()
                .map(effect -> effectiveSpeed(baseSpeed, effect))
                .orElse(baseSpeed);
    }

    private List<RacePlayerSpeedEffect> orderedSpeedEffects(List<RacePlayerSpeedEffect> effects) {
        var ordered = effects.stream()
                .filter(effect -> effect.getType() == EffectType.SPEED_SLOW || effect.getType() == EffectType.SPEED_BOOST)
                .sorted(java.util.Comparator.comparingLong(RacePlayerSpeedEffect::getStartsAtEpochMs))
                .toList();
        Long previousEnd = null;
        for (var effect : ordered) {
            if (effect.getStartsAtEpochMs() >= effect.getEndsAtEpochMs() || effect.getMagnitudeTenths() <= 0
                    || previousEnd != null && effect.getStartsAtEpochMs() < previousEnd) {
                throw new IllegalStateException("Invalid or overlapping persisted speed effects");
            }
            previousEnd = effect.getEndsAtEpochMs();
        }
        return ordered;
    }

    private double effectiveSpeed(double baseSpeed, RacePlayerSpeedEffect effect) {
        long baseTenths = Math.round(baseSpeed * RaceMovementCalculator.SPEED_TENTHS_PER_UNIT);
        long adjusted = effect.getType() == EffectType.SPEED_BOOST
                ? baseTenths + effect.getMagnitudeTenths() : baseTenths - effect.getMagnitudeTenths();
        long maximum = Math.round(RaceProgressRules.MAX_RACING_SPEED * RaceMovementCalculator.SPEED_TENTHS_PER_UNIT);
        return Math.min(maximum, Math.max(RaceSpeedEffectRules.MIN_EFFECTIVE_SPEED_TENTHS, adjusted))
                / (double) RaceMovementCalculator.SPEED_TENTHS_PER_UNIT;
    }
}
