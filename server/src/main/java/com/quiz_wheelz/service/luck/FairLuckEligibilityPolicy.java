package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.common.ChallengeRules;
import com.quiz_wheelz.common.LuckRules;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerGameplayState;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import java.math.BigDecimal;

public class FairLuckEligibilityPolicy {
    public boolean eligible(RacePlayer player, RacePlayerGameplayState state, long instant,
                            boolean acceptedFirstManualNormalAnswer, boolean unresolvedChallenge,
                            boolean activeSpeedEffect, boolean shieldAwarded) {
        return acceptedFirstManualNormalAnswer && beforeFinishGate(player)
                && !unresolvedChallenge && !activeSpeedEffect && !shieldAwarded
                && state.getLuckEventsReceived() < LuckRules.MAX_EVENTS
                && (state.getNextLuckRollNotBeforeEpochMs() == null
                || instant >= state.getNextLuckRollNotBeforeEpochMs());
    }

    public boolean beforeFinishGate(RacePlayer player) {
        return player != null && player.getRace() != null
                && player.getRace().getTotalDistance() != null && player.getRace().getTotalDistance() > 0
                && player.getStatus() == RacePlayerStatus.RACING
                && player.getRace().getStatus() == RaceStatus.IN_PROGRESS
                && player.getPosition() != null && Double.isFinite(player.getPosition())
                && BigDecimal.valueOf(player.getPosition()).compareTo(
                BigDecimal.valueOf(player.getRace().getTotalDistance())
                        .multiply(ChallengeRules.FINISH_GATE_RATIO)) < 0;
    }
}
