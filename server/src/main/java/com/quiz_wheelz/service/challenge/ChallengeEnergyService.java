package com.quiz_wheelz.service.challenge;

import com.quiz_wheelz.common.ChallengeRules;
import com.quiz_wheelz.entitys.RacePlayerGameplayState;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGameplayContext;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChallengeEnergyService {
    @Transactional(propagation = Propagation.MANDATORY)
    public void earn(RacePlayerGameplayState state, Difficulty difficulty,
                     QuestionGameplayContext context, boolean correct) {
        var player = state.getRacePlayer();
        if (!correct || context != QuestionGameplayContext.NORMAL
                || player.getStatus() != RacePlayerStatus.RACING
                || player.getRace().getStatus() != RaceStatus.IN_PROGRESS) {
            return;
        }
        int gain = switch (difficulty) {
            case EASY -> ChallengeRules.EASY_GAIN;
            case MEDIUM -> ChallengeRules.MEDIUM_GAIN;
            case HARD -> ChallengeRules.HARD_GAIN;
        };
        state.setChallengeEnergy(Math.max(0, Math.min(ChallengeRules.ENERGY_THRESHOLD,
                state.getChallengeEnergy() + gain)));
    }
}
