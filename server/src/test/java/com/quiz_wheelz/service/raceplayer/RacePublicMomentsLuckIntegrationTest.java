package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.liveevent.RacePublicMoment;
import com.quiz_wheelz.enums.LuckOutcome;
import com.quiz_wheelz.enums.RaceLiveEventType;
import com.quiz_wheelz.enums.RacePublicMomentKind;
import com.quiz_wheelz.exception.ApiException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

// S4-06: the QUESTION_ANSWERED event of an answer carries the public Luck and Guard Shield facts that answer caused,
// with the id of the server row behind each one. Draw values: the event roll hits below 0.6; the type roll gives
// Tailwind below 0.35, Energy Orb below 0.70 and Mud above.
class RacePublicMomentsLuckIntegrationTest extends B1LuckIntegrationFixture {

    @Test
    void aTailwindIsAPublicMomentOfItsDecision() {
        when(random.nextDouble()).thenReturn(0.0, 0.1);

        submit(true);

        assertEquals(List.of(moment(RacePublicMomentKind.LUCK_TAILWIND, history().getLast().getId())), lastMoments());
    }

    @Test
    void luckOnAWrongNormalAnswerIsStillPublic() {
        when(random.nextDouble()).thenReturn(0.0, 0.5);

        submit(false);

        assertEquals(LuckOutcome.APPLIED, history().getLast().getOutcome());
        assertEquals(List.of(moment(RacePublicMomentKind.LUCK_ENERGY_ORB, history().getLast().getId())), lastMoments());
    }

    @Test
    void appliedMudIsAPublicMoment() {
        when(random.nextDouble()).thenReturn(0.0, 0.9);

        submit(true);

        assertEquals(List.of(moment(RacePublicMomentKind.LUCK_MUD, history().getLast().getId())), lastMoments());
    }

    @Test
    void aShieldBlockIsAPublicMoment() {
        transactions.executeWithoutResult(status -> stateRepository.findByRacePlayerId(secondId).orElseThrow()
                .setGuardShieldCharges(1));
        when(random.nextDouble()).thenReturn(0.0, 0.9);

        submit(true);

        assertEquals(LuckOutcome.BLOCKED_BY_SHIELD, history().getLast().getOutcome());
        assertEquals(List.of(moment(RacePublicMomentKind.LUCK_SHIELD_BLOCKED, history().getLast().getId())),
                lastMoments());
    }

    @Test
    void earningTheGuardShieldIsAPublicMomentAndThatAnswerRollsNothing() {
        transactions.executeWithoutResult(status -> playerRepository.findById(secondId).orElseThrow()
                .setCorrectAnswers(2));
        Long answered = questionId;

        submit(true);

        assertEquals(1, gameplay().getGuardShieldCharges());
        assertTrue(history().isEmpty());
        assertEquals(List.of(moment(RacePublicMomentKind.SHIELD_EARNED, answered)), lastMoments());
    }

    @Test
    void aRollWithoutAnEventIsNoMoment() {
        submit(true);

        assertEquals(LuckOutcome.NO_EVENT, history().getLast().getOutcome());
        assertEquals(List.of(), lastMoments());
    }

    @Test
    void theSameAnswerPostedTwiceTellsItsMomentOnce() {
        when(random.nextDouble()).thenReturn(0.0, 0.1);
        var request = request(true);

        answerService.submitAnswer(second(), request);
        assertThrows(ApiException.class, () -> answerService.submitAnswer(second(), request));

        assertEquals(1, eventTypes().stream().filter(type -> type == RaceLiveEventType.QUESTION_ANSWERED).count());
        assertEquals(1, answeredMoments().getLast().size());
    }

    private List<RacePublicMoment> lastMoments() {
        return answeredMoments().getLast();
    }

    private static RacePublicMoment moment(RacePublicMomentKind kind, Long sourceId) {
        return new RacePublicMoment(kind, sourceId);
    }
}
