package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.common.LuckRules;
import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.common.RaceSpeedEffectRules;
import com.quiz_wheelz.entitys.RacePlayerGameplayState;
import com.quiz_wheelz.entitys.RacePlayerSpeedEffect;
import com.quiz_wheelz.enums.*;
import com.quiz_wheelz.service.raceengine.RacePlayerSpeedEffectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class LuckEffectResolver {
    private final RacePlayerSpeedEffectService effects;
    private final LuckOwnStateReader ownState;

    public Applied apply(RacePlayerGameplayState state, LuckDrawPolicy.Result result, long instant) {
        if (result.outcome() == LuckOutcome.BLOCKED_BY_SHIELD) {
            state.setGuardShieldCharges(0);
            return new Applied(null, null);
        }
        if (!result.tangible()) {
            return new Applied(null, null);
        }
        if (result.appliedType() == LuckEventType.ENERGY_ORB) {
            state.setChallengeEnergy(state.getChallengeEnergy() + result.energyDelta());
            return new Applied(null, (double) result.energyDelta());
        }
        boolean boost = result.appliedType() == LuckEventType.TAILWIND;
        var player = state.getRacePlayer();
        long end = Math.addExact(instant, boost ? LuckRules.TAILWIND_DURATION_MS : LuckRules.MUD_DURATION_MS);
        if (ownState.hasOverlap(player.getId(), instant, end)) {
            throw new com.quiz_wheelz.exception.ApiException(com.quiz_wheelz.exception.ErrorCode.SPEED_EFFECT_OVERLAP);
        }
        var effect = boost ? effects.createBoostForLockedPlayer(player, EffectSource.LUCK_EVENT,
                LuckRules.TAILWIND_MAGNITUDE_TENTHS, instant, Math.addExact(instant, LuckRules.TAILWIND_DURATION_MS))
                : effects.createSlowdownForLockedPlayer(player, EffectSource.LUCK_EVENT,
                LuckRules.MUD_MAGNITUDE_TENTHS, instant, Math.addExact(instant, LuckRules.MUD_DURATION_MS));
        long baseTenths = Math.round(player.getSpeed() * 10);
        long availableTenths = boost ? Math.round(RaceProgressRules.MAX_RACING_SPEED * 10) - baseTenths
                : baseTenths - RaceSpeedEffectRules.MIN_EFFECTIVE_SPEED_TENTHS;
        return new Applied(effect, Math.max(0, Math.min(effect.getMagnitudeTenths(), availableTenths)) / 10.0);
    }

    public record Applied(RacePlayerSpeedEffect effect, Double value) {
    }
}