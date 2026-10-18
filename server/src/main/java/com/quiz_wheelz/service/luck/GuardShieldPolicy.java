package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.common.LuckRules;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayerGameplayState;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.QuestionGameplayContext;
import java.util.Objects;

public class GuardShieldPolicy {
    private final FairLuckEligibilityPolicy eligibility = new FairLuckEligibilityPolicy();

    public boolean award(RacePlayerGameplayState state, PlayerQuestion question,
                         boolean acceptedFirstManualAnswer, boolean correct) {
        var player = state.getRacePlayer();
        if (!acceptedFirstManualAnswer || !correct || question.getId() == null
                || !Objects.equals(question.getRacePlayer().getId(), player.getId())
                || question.getStatus() != PlayerQuestionStatus.ANSWERED
                || question.getGameplayContext() != QuestionGameplayContext.NORMAL
                || !eligibility.beforeFinishGate(player) || state.getGuardShieldGranted()
                || player.getCorrectAnswers() != LuckRules.SHIELD_CORRECT_ANSWERS) {
            return false;
        }
        state.setGuardShieldCharges(1);
        state.setGuardShieldGranted(true);
        state.setGuardShieldAwardQuestionId(question.getId());
        return true;
    }
}
