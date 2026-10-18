package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.common.LuckRules;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class FairLuckService {
    private final LuckTransactionGuard guard;
    private final GuardShieldService shields;
    private final RaceLuckFairnessStateRepository fairnessStates;
    private final RacePlayerLuckDecisionRepository decisions;
    private final LuckOwnStateReader ownState;
    private final LuckPeerReader peers;
    private final LuckRandomSource random;
    private final LuckEffectResolver effects;
    private final EntityManager em;
    private final FairLuckEligibilityPolicy eligibility = new FairLuckEligibilityPolicy();
    private final RaceLuckFairnessPolicy fairness = new RaceLuckFairnessPolicy();

    public Optional<RacePlayerLuckDecision> afterAcceptedManualNormalAnswer(
            RacePlayer player, PlayerQuestion question, boolean correct, boolean firstAccepted, long instant) {
        guard.requireLocked(player);
        guard.requireOwnedAnsweredNormal(player, question);
        if (!firstAccepted) {
            return Optional.empty();
        }
        var state = shields.obtainForLockedPlayer(player);
        var raceState = fairnessStates.findLockedByRaceId(player.getRace().getId()).map(existing -> {
            em.refresh(existing, LockModeType.PESSIMISTIC_WRITE);
            return existing;
        }).orElseGet(() -> {
            var created = new RaceLuckFairnessState();
            created.setRace(player.getRace());
            return fairnessStates.save(created);
        });
        if (decisions.findLockedBySource(player.getId(), question.getId()).isPresent()
                || Objects.equals(state.getGuardShieldAwardQuestionId(), question.getId())) {
            return Optional.empty();
        }
        state.setLastAcceptedManualNormalAnswerAtEpochMs(instant);
        boolean awarded = shields.afterAcceptedManualNormalAnswer(state, question, correct, true);
        boolean eligible = eligibility.eligible(player, state, instant, true,
                ownState.hasChallenge(player.getId()),
                ownState.hasSpeedEffect(player.getId(), instant), awarded);
        if (!eligible) {
            return Optional.empty();
        }
        Long recipientId = raceState.getLastEventRecipient() == null ? null : raceState.getLastEventRecipient().getId();
        var current = new RaceLuckFairnessPolicy.Candidate(player.getId(), state.getLuckEventsReceived(),
                state.getLastLuckRollSequence(), instant, true);
        if (fairness.defer(current, peers.readCommittedPeers(player.getRace().getId(), player.getId(), instant),
                recipientId, raceState.getLastEventSequence(), instant, LuckRules.PROVISIONAL_ACTIVITY_WINDOW_MS)) {
            return Optional.empty();
        }
        var result = new LuckDrawPolicy(random).attempt(true, false, state.getLastLuckWasNegative(),
                player.getSpeed(), state.getChallengeEnergy(), state.getGuardShieldCharges());
        long sequence = Math.addExact(raceState.getDecisionSequence(), 1);
        raceState.setDecisionSequence(sequence);
        var applied = effects.apply(state, result, instant);
        state.setLuckRollsTaken(Math.incrementExact(state.getLuckRollsTaken()));
        state.setLastLuckRollSequence(sequence);
        state.setNextLuckRollNotBeforeEpochMs(result.nextRollNotBefore(instant));
        state.setLastLuckWasNegative(result.nextNegativeGuard(state.getLastLuckWasNegative()));
        if (result.tangible()) {
            state.setLuckEventsReceived(state.getLuckEventsReceived() + 1);
            state.setLastLuckReceivedSequence(sequence);
            raceState.setLastEventRecipient(player);
            raceState.setLastEventSequence(sequence);
        }
        var decision = new RacePlayerLuckDecision();
        decision.setRacePlayer(player);
        decision.setSourceQuestion(question);
        decision.setDecisionSequence(sequence);
        decision.setDecidedAtEpochMs(instant);
        decision.setSelectedType(result.selectedType());
        decision.setAppliedType(result.appliedType());
        decision.setOutcome(result.outcome());
        decision.setSpeedEffect(applied.effect());
        decision.setEffectiveMagnitudeOrEnergyDelta(applied.value());
        return Optional.of(decisions.save(decision));
    }
}