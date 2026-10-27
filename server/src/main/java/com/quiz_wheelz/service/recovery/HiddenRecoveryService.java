package com.quiz_wheelz.service.recovery;

import com.quiz_wheelz.common.RecoveryRules;
import com.quiz_wheelz.config.ConfigPropertyKeys;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerGameplayState;
import com.quiz_wheelz.entitys.RacePlayerRecoveryState;
import com.quiz_wheelz.enums.QuestionGameplayContext;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.repository.RacePlayerRecoveryStateRepository;
import com.quiz_wheelz.service.challenge.ChallengeEnergyService;
import com.quiz_wheelz.service.raceplayer.StudentRaceStandingResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.Optional;

@Service
public class HiddenRecoveryService {
    private static final Logger LOGGER = LoggerFactory.getLogger(HiddenRecoveryService.class);

    private final boolean enabled;
    private final RacePlayerRecoveryStateRepository states;
    private final ChallengeEnergyService energy;
    private final RecoveryPolicy policy = new RecoveryPolicy();

    public HiddenRecoveryService(
            @Value("${" + ConfigPropertyKeys.QUIZWHEELZ_RECOVERY_ENABLED + ":false}") boolean enabled,
            RacePlayerRecoveryStateRepository states, ChallengeEnergyService energy) {
        this.enabled = enabled;
        this.states = Objects.requireNonNull(states);
        this.energy = Objects.requireNonNull(energy);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void observeAcceptedAnswer(RacePlayer player, PlayerQuestion question, boolean correct) {
        observe(player, question, correct);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void observePenalizedTimeout(RacePlayer player, PlayerQuestion question) {
        observe(player, question, false);
    }

    // The standings are the ones the answer projected at its decision instant for its own response; no standings
    // means no grant, and the right is kept.
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean nudgeAfterNormalGain(RacePlayer player, PlayerQuestion question, RacePlayerGameplayState gameplay,
                                        long decisionEpochMs, StudentRaceStandingResult standings) {
        if (!enabled || question.getGameplayContext() != QuestionGameplayContext.NORMAL) {
            return false;
        }
        var state = states.findByRacePlayerId(player.getId()).orElse(null);
        if (state == null || state.getAwardedQuestionId() != null
                || !Objects.equals(state.getLastObservedNormalQuestionId(), question.getId())
                || !policy.struggling(state.getRecentOutcomeBits(), state.getRecentOutcomeCount())
                || !policy.hasRoomForNudge(gameplay.getChallengeEnergy())) {
            return false;
        }
        var standing = standingOf(player, standings);
        if (standing.isEmpty() || !policy.behind(standing.get())) {
            return false;
        }
        energy.addRecoveryNudge(gameplay);
        state.setAwardedQuestionId(question.getId());
        state.setAwardedEnergy(RecoveryRules.NUDGE_ENERGY);
        state.setAwardedAtEpochMs(decisionEpochMs);
        return true;
    }

    private void observe(RacePlayer player, PlayerQuestion question, boolean correct) {
        if (!enabled || question.getGameplayContext() != QuestionGameplayContext.NORMAL) {
            return;
        }
        var state = states.findByRacePlayerId(player.getId()).orElseGet(() -> states.save(newState(player)));
        // After the one grant the window has no use left, so later answers write nothing.
        if (state.getAwardedQuestionId() != null) {
            return;
        }
        Long last = state.getLastObservedNormalQuestionId();
        // A NORMAL question resolves once and only one is active at a time, so ids only grow here. An old id is
        // ignored instead of thrown: Recovery must never turn a student's answer into an error.
        if (last != null && question.getId() <= last) {
            if (question.getId() < last) {
                LOGGER.warn("Recovery ignored question {} of race player {}: already observed up to {}",
                        question.getId(), player.getId(), last);
            }
            return;
        }
        state.setRecentOutcomeBits(policy.appendOutcome(state.getRecentOutcomeBits(), correct));
        state.setRecentOutcomeCount(policy.nextCount(state.getRecentOutcomeCount()));
        state.setLastObservedNormalQuestionId(question.getId());
    }

    // The field is the classmates still racing: their positions come projected to the decision instant.
    private Optional<RecoveryStanding> standingOf(RacePlayer player, StudentRaceStandingResult standings) {
        Integer totalDistance = player.getRace().getTotalDistance();
        if (standings == null || totalDistance == null) {
            return Optional.empty();
        }
        var peers = standings.opponents().stream()
                .filter(opponent -> opponent.status() == RacePlayerStatus.RACING)
                .map(StudentRaceStandingResult.Opponent::position)
                .toList();
        return policy.standing(totalDistance, player.getPosition(), peers);
    }

    private static RacePlayerRecoveryState newState(RacePlayer player) {
        var state = new RacePlayerRecoveryState();
        state.setRacePlayer(player);
        return state;
    }
}
