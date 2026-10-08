package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeRules;
import com.quiz_wheelz.entitys.RacePlayerGameplayState;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class ChallengeEligibilityService {
    public boolean eligible(RacePlayerGameplayState state, boolean unresolved) {
        var player = state.getRacePlayer();
        var race = player.getRace();
        if (unresolved || state.getChallengeEnergy() != ChallengeRules.ENERGY_THRESHOLD
                || player.getStatus() != RacePlayerStatus.RACING
                || race == null || race.getStatus() != RaceStatus.IN_PROGRESS
                || race.getTotalDistance() == null || race.getTotalDistance() <= 0
                || player.getPosition() == null || !Double.isFinite(player.getPosition())) {
            return false;
        }
        return BigDecimal.valueOf(player.getPosition()).compareTo(
                BigDecimal.valueOf(race.getTotalDistance()).multiply(ChallengeRules.FINISH_GATE_RATIO)) < 0;
    }
}
