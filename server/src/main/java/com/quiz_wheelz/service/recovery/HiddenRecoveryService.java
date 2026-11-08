package com.quiz_wheelz.service.recovery;

import com.quiz_wheelz.common.RecoveryRules;
import com.quiz_wheelz.config.ConfigPropertyKeys;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerGameplayState;
import com.quiz_wheelz.entitys.RacePlayerRecoveryState;
import com.quiz_wheelz.enums.QuestionGameplayContext;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
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

    // Review M2: the callers own the transaction, the student's row lock and the lifecycle check (a RACING student in an
    // IN_PROGRESS race): ChallengeOfferService.afterAnswer and QuestionTimeoutService. Nothing here takes a lock.
    // The returned window is the row nudgeAfterNormalGain takes, so a correct answer reads it once (review M3).
    @Transactional(propagation = Propagation.MANDATORY)
    public Optional<RacePlayerRecoveryState> observeAcceptedAnswer(RacePlayer player, PlayerQuestion question,
                                                                   boolean correct) {
        return observe(player, question, correct);
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void observePenalizedTimeout(RacePlayer player, PlayerQuestion question) {
        observe(player, question, false);
    }

    // The standings are the ones the answer projected at its decision instant for its own response; no standings
    // means no grant, and the right is kept.
    @Transactional(propagation = Propagation.MANDATORY)
    public boolean nudgeAfterNormalGain(RacePlayer player, PlayerQuestion question, RacePlayerRecoveryState state,
                                        RacePlayerGameplayState gameplay, long decisionEpochMs,
                                        StudentRaceStandingResult standings) {
        // Review M2: like ChallengeEnergyService.earn, the grant checks the lifecycle itself. The answer that crosses the
        // line never gets here: it marks the student FINISHED first, and the offer step stops there.
        if (!enabled || question.getGameplayContext() != QuestionGameplayContext.NORMAL
                || player.getStatus() != RacePlayerStatus.RACING
                || player.getRace().getStatus() != RaceStatus.IN_PROGRESS) {
            return false;
        }
        if (state.getAwardedQuestionId() != null
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

    private Optional<RacePlayerRecoveryState> observe(RacePlayer player, PlayerQuestion question, boolean correct) {
        if (!enabled || question.getGameplayContext() != QuestionGameplayContext.NORMAL) {
            return Optional.empty();
        }
        var state = states.findByRacePlayerId(player.getId()).orElseGet(() -> states.save(newState(player)));
        append(state, player, question, correct);
        return Optional.of(state);
    }

    private void append(RacePlayerRecoveryState state, RacePlayer player, PlayerQuestion question, boolean correct) {
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
                // A classmate over the line stays RACING until the finish sweep or arbitration settles it, but has left
                // the field already (the finished-leader rule). An unknown position still stops the decision (policy).
                .filter(position -> position == null || position < totalDistance)
                .toList();
        return policy.standing(totalDistance, player.getPosition(), peers);
    }

    private static RacePlayerRecoveryState newState(RacePlayer player) {
        var state = new RacePlayerRecoveryState();
        state.setRacePlayer(player);
        return state;
    }
}
