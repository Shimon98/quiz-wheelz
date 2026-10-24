package com.quiz_wheelz.service.luck;

import com.quiz_wheelz.common.LuckRules;
import com.quiz_wheelz.entitys.*;
import com.quiz_wheelz.enums.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;
import static com.quiz_wheelz.service.luck.RaceLuckFairnessPolicy.Candidate;

class LuckPolicyTest {
    private RacePlayerGameplayState state() {
        var race = new Race();
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setTotalDistance(1000);
        var player = new RacePlayer();
        player.setId(1L);
        player.setRace(race);
        player.setStatus(RacePlayerStatus.RACING);
        player.setPosition(100.0);
        var state = new RacePlayerGameplayState();
        state.setRacePlayer(player);
        return state;
    }

    private PlayerQuestion question(RacePlayerGameplayState state) {
        var question = new PlayerQuestion();
        question.setId(9L);
        question.setRacePlayer(state.getRacePlayer());
        question.setStatus(PlayerQuestionStatus.ANSWERED);
        return question;
    }

    @Test
    void cumulativeCorrectAnswersAwardOnlyOnceWithoutStreak() {
        var state = state();
        var question = question(state);
        var policy = new GuardShieldPolicy();
        int[] counts = {1, 2, 2};
        boolean[] correct = {true, true, false};
        for (int i = 0; i < counts.length; i++) {
            state.getRacePlayer().setCorrectAnswers(counts[i]);
            assertFalse(policy.award(state, question, true, correct[i]));
        }
        state.getRacePlayer().setCorrectAnswers(3);
        state.getRacePlayer().setStreak(1);
        assertTrue(policy.award(state, question, true, true));
        assertEquals(1, state.getGuardShieldCharges());
        assertEquals(9L, state.getGuardShieldAwardQuestionId());
        state.setGuardShieldCharges(0);
        assertFalse(policy.award(state, question, true, true));
    }

    @Test
    void shieldExclusionsDoNotMutateLearningOrState() {
        for (int exclusion = 0; exclusion < 8; exclusion++) {
            var state = state();
            state.getRacePlayer().setCorrectAnswers(3);
            var question = question(state);
            if (exclusion == 0) state.getRacePlayer().setPosition(800.0);
            if (exclusion == 1) state.getRacePlayer().setStatus(RacePlayerStatus.FINISHED);
            if (exclusion == 2) question.setGameplayContext(QuestionGameplayContext.TURBO_TRIAL);
            if (exclusion == 3) question.setStatus(PlayerQuestionStatus.EXPIRED);
            if (exclusion == 4) state.getRacePlayer().getRace().setStatus(RaceStatus.FINISHED);
            if (exclusion == 5) question.setGameplayContext(QuestionGameplayContext.SAFE_RUN);
            assertFalse(new GuardShieldPolicy().award(state, question, exclusion != 6, exclusion != 7));
            assertEquals(0, state.getGuardShieldCharges());
            assertEquals(3, state.getRacePlayer().getCorrectAnswers());
        }
    }

    @Test
    void everyEligibilityExclusionUsesZeroRandomCalls() {
        var eligibility = new FairLuckEligibilityPolicy();
        for (int exclusion = 0; exclusion < 10; exclusion++) {
            var state = state();
            if (exclusion == 0) state.getRacePlayer().setPosition(800.0);
            if (exclusion == 1) state.getRacePlayer().setStatus(RacePlayerStatus.FINISHED);
            if (exclusion == 2) state.getRacePlayer().getRace().setStatus(RaceStatus.FINISHED);
            if (exclusion == 3) state.setLuckEventsReceived(2);
            if (exclusion == 4) state.setNextLuckRollNotBeforeEpochMs(101L);
            boolean allowed = eligibility.eligible(state.getRacePlayer(), state, 100,
                    exclusion != 5, exclusion == 6, exclusion == 7, exclusion == 8);
            var calls = new AtomicInteger();
            var draw = new LuckDrawPolicy(() -> { calls.incrementAndGet(); return 0; });
            assertNull(draw.attempt(allowed, exclusion == 9, false, 1, 0, 0));
            assertEquals(0, calls.get());
            assertNull(state.getLastLuckRollSequence());
        }
    }

    @Test
    void firstAnswerAndExactCooldownBoundaryAreEligible() {
        var state = state();
        var eligibility = new FairLuckEligibilityPolicy();
        assertTrue(eligibility.eligible(state.getRacePlayer(), state, 100, true, false, false, false));
        var result = new LuckDrawPolicy(() -> 0.6).attempt(true, false, true, 1, 0, 0);
        assertEquals(LuckOutcome.NO_EVENT, result.outcome());
        assertFalse(result.tangible());
        assertTrue(result.nextNegativeGuard(true));
        state.setNextLuckRollNotBeforeEpochMs(result.nextRollNotBefore(100));
        assertFalse(eligibility.eligible(state.getRacePlayer(), state, 45099, true, false, false, false));
        assertTrue(eligibility.eligible(state.getRacePlayer(), state, 45100, true, false, false, false));
    }

    @Test
    void eventProbabilityAndWeightedBoundariesAreExact() {
        double[] types = {0, 0.349999, 0.35, 0.699999, 0.70, Math.nextDown(1.0)};
        LuckEventType[] expected = {LuckEventType.TAILWIND, LuckEventType.TAILWIND,
                LuckEventType.ENERGY_ORB, LuckEventType.ENERGY_ORB,
                LuckEventType.MUD_SPLASH, LuckEventType.MUD_SPLASH};
        for (int i = 0; i < types.length; i++) {
            var index = new AtomicInteger();
            double type = types[i];
            var draw = new LuckDrawPolicy(() -> index.getAndIncrement() == 0 ? 0.5999 : type);
            assertEquals(expected[i], draw.attempt(true, false, false, 1, 0, 0).selectedType());
            assertEquals(2, index.get());
        }
        var calls = new AtomicInteger();
        var draw = new LuckDrawPolicy(() -> { calls.incrementAndGet(); return 0.6000; });
        assertEquals(LuckOutcome.NO_EVENT, draw.attempt(true, false, false, 1, 0, 0).outcome());
        assertEquals(1, calls.get());
    }

    @Test
    void mudBlockedIsTangibleAndNegativeAndCannotRepeat() {
        var index = new AtomicInteger();
        var draw = new LuckDrawPolicy(() -> index.getAndIncrement() == 0 ? 0 : 0.99);
        var blocked = draw.attempt(true, false, false, 1, 0, 1);
        assertEquals(LuckOutcome.BLOCKED_BY_SHIELD, blocked.outcome());
        assertTrue(blocked.tangible());
        assertTrue(blocked.nextNegativeGuard(false));
        for (double type : new double[]{0, 0.49999, 0.5, 0.99}) {
            index.set(0);
            var positive = new LuckDrawPolicy(() -> index.getAndIncrement() == 0 ? 0 : type)
                    .attempt(true, false, true, 1, 0, 0);
            assertNotEquals(LuckEventType.MUD_SPLASH, positive.appliedType());
            assertFalse(positive.nextNegativeGuard(true));
        }
    }

    @Test
    void applicabilityDoesNotRerollAndOrbIsCapped() {
        for (double selected : new double[]{0.1, 0.5}) {
            var index = new AtomicInteger();
            var result = new LuckDrawPolicy(() -> index.getAndIncrement() == 0 ? 0 : selected)
                    .attempt(true, false, true, 2, 100, 0);
            assertEquals(LuckOutcome.NO_EFFECT, result.outcome());
            assertFalse(result.tangible());
            assertTrue(result.nextNegativeGuard(true));
            assertEquals(45100, result.nextRollNotBefore(100));
            assertEquals(2, index.get());
        }
        var result = new LuckDrawPolicy(() -> 0).attempt(true, false, false, 2, 95, 0);
        assertEquals(LuckEventType.TAILWIND, result.selectedType());
        assertEquals(LuckEventType.ENERGY_ORB, result.appliedType());
        assertEquals(5, result.energyDelta());
    }

    @ParameterizedTest
    @ValueSource(doubles = {1.9999999999999998, 2.0, 1.95})
    void tailwindAtTheMaximumSpeedInTenthsBecomesAnOrbOrNoEffect(double speed) {
        var orb = new LuckDrawPolicy(() -> 0).attempt(true, false, false, speed, 0, 0);
        assertEquals(LuckEventType.TAILWIND, orb.selectedType());
        assertEquals(LuckEventType.ENERGY_ORB, orb.appliedType());
        assertEquals(LuckOutcome.APPLIED, orb.outcome());
        assertEquals(LuckRules.ORB_ENERGY, orb.energyDelta());
        var full = new LuckDrawPolicy(() -> 0).attempt(true, false, false, speed, 100, 0);
        assertEquals(LuckOutcome.NO_EFFECT, full.outcome());
        assertNull(full.appliedType());
    }

    @ParameterizedTest
    @ValueSource(doubles = {1.94, 1.89, 0.5})
    void tailwindBelowTheMaximumSpeedInTenthsStaysATailwind(double speed) {
        var result = new LuckDrawPolicy(() -> 0).attempt(true, false, false, speed, 0, 0);
        assertEquals(LuckEventType.TAILWIND, result.appliedType());
        assertEquals(LuckOutcome.APPLIED, result.outcome());
    }

    @ParameterizedTest
    @ValueSource(doubles = {-0.1, 1.0, Double.NaN, Double.POSITIVE_INFINITY})
    void invalidRandomValuesAreRejected(double value) {
        assertThrows(IllegalArgumentException.class, () ->
                new LuckDrawPolicy(() -> value).attempt(true, false, false, 1, 0, 0));
    }

    @ParameterizedTest
    @ValueSource(longs = {30000, 60000, 90000})
    void peerOpportunityAndActivityBoundWaiting(long window) {
        var policy = new RaceLuckFairnessPolicy();
        var current = new Candidate(1, 1, 5L, 100000L, true);
        var peer = new Candidate(2, 0, null, 100000L, true);
        assertTrue(policy.defer(current, List.of(peer), 1L, 5L, 100000, window));
        assertFalse(policy.defer(current, List.of(new Candidate(2, 0, 6L, 100000L, true)),
                1L, 5L, 100000, window));
        assertFalse(policy.defer(current, List.of(peer), 1L, 5L, 100001 + window, window));
        assertFalse(policy.defer(current, List.of(new Candidate(2, 0, null, 100000L, false)),
                1L, 5L, 100000, window));
        assertFalse(policy.defer(current, List.of(new Candidate(2, 0, null, null, true)),
                1L, 5L, 100000, window));
        assertFalse(policy.defer(current, List.of(), 1L, 5L, 100000, window));
    }

    @ParameterizedTest
    @ValueSource(ints = {2, 4, 8})
    void allEligiblePeersMustHaveAnOpportunityBeforeLastRecipientRepeats(int players) {
        var policy = new RaceLuckFairnessPolicy();
        var current = new Candidate(1, 1, 5L, 100L, true);
        var peers = new java.util.ArrayList<Candidate>();
        for (int id = 2; id <= players; id++) {
            peers.add(new Candidate(id, 0, null, 100L, true));
        }
        for (int index = 0; index < peers.size(); index++) {
            assertTrue(policy.defer(current, peers, 1L, 5L, 100, 60000));
            peers.set(index, new Candidate(index + 2, 0, 6L + index, 100L, true));
        }
        assertFalse(policy.defer(current, peers, 1L, 5L, 100, 60000));
    }

    @Test
    void eventCapAcceptsOneButRejectsTwoTangibleEvents() {
        var state = state();
        var eligibility = new FairLuckEligibilityPolicy();
        state.setLuckEventsReceived(1);
        assertTrue(eligibility.eligible(state.getRacePlayer(), state, 100, true, false, false, false));
        state.setLuckEventsReceived(2);
        assertFalse(eligibility.eligible(state.getRacePlayer(), state, 100, true, false, false, false));
    }

    @Test
    void sameMillisecondUsesSequenceAndLastRecipientPriority() {
        var policy = new RaceLuckFairnessPolicy();
        var current = new Candidate(1, 1, 5L, 100L, true);
        assertTrue(policy.defer(current, List.of(new Candidate(2, 1, 4L, 100L, true)),
                1L, 5L, 100, LuckRules.PROVISIONAL_ACTIVITY_WINDOW_MS));
        assertFalse(policy.defer(current, List.of(new Candidate(2, 1, 6L, 100L, true)),
                1L, 5L, 100, LuckRules.PROVISIONAL_ACTIVITY_WINDOW_MS));
        assertFalse(policy.defer(current, List.of(new Candidate(2, 1, 4L, 100L, true)),
                3L, 5L, 100, LuckRules.PROVISIONAL_ACTIVITY_WINDOW_MS));
    }
}
