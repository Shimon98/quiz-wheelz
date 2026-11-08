package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.dto.liveevent.RacePublicMoment;
import com.quiz_wheelz.entitys.RacePlayerChallengeOffer;
import com.quiz_wheelz.entitys.RacePlayerLuckDecision;
import com.quiz_wheelz.enums.ChallengeOutcome;
import com.quiz_wheelz.enums.LuckEventType;
import com.quiz_wheelz.enums.LuckOutcome;
import com.quiz_wheelz.enums.RacePublicMomentKind;
import com.quiz_wheelz.service.luck.LuckAnswerResult;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RacePublicMomentPolicyTest {
    private static final Long QUESTION_ID = 9001L;
    private static final Long DECISION_ID = 312L;
    private static final Long OFFER_ID = 44L;

    private final RacePublicMomentPolicy policy = new RacePublicMomentPolicy();

    @Test
    void aNormalAnswerWithoutLuckIsNoMoment() {
        assertEquals(List.of(), policy.forNormalAnswer(QUESTION_ID, LuckAnswerResult.NONE));
    }

    @Test
    void earningTheGuardShieldIsAMomentOfThatQuestion() {
        assertEquals(List.of(new RacePublicMoment(RacePublicMomentKind.SHIELD_EARNED, QUESTION_ID)),
                policy.forNormalAnswer(QUESTION_ID, new LuckAnswerResult(Optional.empty(), true)));
    }

    // Named by what the server applied, not by what it drew: a Tailwind at top speed is applied as an Energy Orb.
    @ParameterizedTest
    @CsvSource({
            "APPLIED, TAILWIND, TAILWIND, LUCK_TAILWIND",
            "APPLIED, TAILWIND, ENERGY_ORB, LUCK_ENERGY_ORB",
            "APPLIED, ENERGY_ORB, ENERGY_ORB, LUCK_ENERGY_ORB",
            "APPLIED, MUD_SPLASH, MUD_SPLASH, LUCK_MUD",
            "BLOCKED_BY_SHIELD, MUD_SPLASH, MUD_SPLASH, LUCK_SHIELD_BLOCKED",
    })
    void aTangibleLuckDecisionIsAMomentOfThatDecision(LuckOutcome outcome, LuckEventType selected,
                                                       LuckEventType applied, RacePublicMomentKind kind) {
        assertEquals(List.of(new RacePublicMoment(kind, DECISION_ID)),
                policy.forNormalAnswer(QUESTION_ID, luck(outcome, selected, applied)));
    }

    @ParameterizedTest
    @EnumSource(value = LuckOutcome.class, names = {"NO_EVENT", "NO_EFFECT"})
    void aRollThatChangedNothingIsNoMoment(LuckOutcome outcome) {
        assertEquals(List.of(), policy.forNormalAnswer(QUESTION_ID,
                luck(outcome, outcome == LuckOutcome.NO_EVENT ? null : LuckEventType.ENERGY_ORB, null)));
    }

    @ParameterizedTest
    @EnumSource(value = ChallengeOutcome.class, names = {"TURBO_SUCCESS", "SAFE_PERFECT"})
    void aChallengeWonByThisAnswerIsAMomentOfItsOffer(ChallengeOutcome outcome) {
        assertEquals(List.of(new RacePublicMoment(RacePublicMomentKind.valueOf(outcome.name()), OFFER_ID)),
                policy.forChallengeAnswer(offer(outcome), null));
    }

    @ParameterizedTest
    @EnumSource(value = ChallengeOutcome.class, names = {"TURBO_FAILURE", "SAFE_COMPLETE"})
    void aStudentsFailureIsNeverPublic(ChallengeOutcome outcome) {
        assertEquals(List.of(), policy.forChallengeAnswer(offer(outcome), null));
    }

    @Test
    void aChallengeStillRunningOrAlreadyResolvedBeforeThisAnswerIsNoMoment() {
        assertEquals(List.of(), policy.forChallengeAnswer(offer(null), null));
        assertEquals(List.of(), policy.forChallengeAnswer(offer(ChallengeOutcome.SAFE_PERFECT), ChallengeOutcome.SAFE_PERFECT));
        assertEquals(List.of(), policy.forChallengeAnswer(null, null));
    }

    private static LuckAnswerResult luck(LuckOutcome outcome, LuckEventType selected, LuckEventType applied) {
        RacePlayerLuckDecision decision = mock(RacePlayerLuckDecision.class);
        when(decision.getId()).thenReturn(DECISION_ID);
        when(decision.getOutcome()).thenReturn(outcome);
        when(decision.getSelectedType()).thenReturn(selected);
        when(decision.getAppliedType()).thenReturn(applied);
        return new LuckAnswerResult(Optional.of(decision), false);
    }

    private static RacePlayerChallengeOffer offer(ChallengeOutcome outcome) {
        RacePlayerChallengeOffer offer = mock(RacePlayerChallengeOffer.class);
        when(offer.getId()).thenReturn(OFFER_ID);
        when(offer.getOutcome()).thenReturn(outcome);
        return offer;
    }
}
