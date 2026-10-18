package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.common.ChallengeRules;
import com.quiz_wheelz.common.LuckRules;
import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.enums.LuckEventType;
import com.quiz_wheelz.enums.LuckOutcome;
import java.util.Objects;

public class LuckDrawPolicy {
    private final LuckRandomSource random;

    public LuckDrawPolicy(LuckRandomSource random) {
        this.random = Objects.requireNonNull(random);
    }

    public Result attempt(boolean eligible, boolean fairnessDeferred, boolean lastNegative,
                          double effectiveSpeed, int energy, int shieldCharges) {
        if (!eligible || fairnessDeferred) {
            return null;
        }
        if (roll() >= LuckRules.EVENT_PROBABILITY) {
            return new Result(null, null, LuckOutcome.NO_EVENT, 0);
        }
        double typeRoll = roll();
        LuckEventType selected = lastNegative
                ? (typeRoll < 0.5 ? LuckEventType.TAILWIND : LuckEventType.ENERGY_ORB)
                : (typeRoll < 0.35 ? LuckEventType.TAILWIND
                : typeRoll < 0.70 ? LuckEventType.ENERGY_ORB : LuckEventType.MUD_SPLASH);
        LuckEventType applied = selected;
        if (selected == LuckEventType.TAILWIND && effectiveSpeed >= RaceProgressRules.MAX_RACING_SPEED) {
            applied = LuckEventType.ENERGY_ORB;
        }
        if (applied == LuckEventType.ENERGY_ORB && energy >= ChallengeRules.ENERGY_THRESHOLD) {
            return new Result(selected, null, LuckOutcome.NO_EFFECT, 0);
        }
        var outcome = applied == LuckEventType.MUD_SPLASH && shieldCharges > 0
                ? LuckOutcome.BLOCKED_BY_SHIELD : LuckOutcome.APPLIED;
        int delta = applied == LuckEventType.ENERGY_ORB
                ? Math.min(LuckRules.ORB_ENERGY, ChallengeRules.ENERGY_THRESHOLD - energy) : 0;
        return new Result(selected, applied, outcome, delta);
    }

    private double roll() {
        double value = random.nextDouble();
        if (!Double.isFinite(value) || value < 0 || value >= 1) {
            throw new IllegalArgumentException();
        }
        return value;
    }

    public record Result(LuckEventType selectedType, LuckEventType appliedType, LuckOutcome outcome,
                         int energyDelta) {
        public boolean tangible() {
            return outcome == LuckOutcome.APPLIED || outcome == LuckOutcome.BLOCKED_BY_SHIELD;
        }

        public boolean nextNegativeGuard(boolean previous) {
            return tangible() ? appliedType == LuckEventType.MUD_SPLASH : previous;
        }

        public long nextRollNotBefore(long instant) {
            return Math.addExact(instant, LuckRules.COOLDOWN_MS);
        }
    }
}
