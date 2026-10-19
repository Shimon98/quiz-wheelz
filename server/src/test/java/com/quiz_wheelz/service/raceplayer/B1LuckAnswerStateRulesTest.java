package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerFocusEventRequest;
import com.quiz_wheelz.enums.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@Import(RacePlayerFocusEventService.class)
class B1LuckAnswerStateRulesTest extends B1LuckIntegrationFixture {
    @Autowired RacePlayerFocusEventService focus;

    @Test
    void cooldownIsExactlyFortyFiveSecondsIncludingNoEventAndNoEffect() {
        submit(false);
        assertEquals(T + 45000, gameplay().getNextLuckRollNotBeforeEpochMs());
        nextQuestion(T + 44999);
        submit(false);
        assertEquals(1, history().size());
        nextQuestion(T + 45000);
        submit(false);
        assertEquals(2, history().size());
        energy(100);
        when(random.nextDouble()).thenReturn(0.0, 0.5);
        nextQuestion(T + 90000);
        submit(false);
        assertEquals(LuckOutcome.NO_EFFECT, history().getLast().getOutcome());
        assertEquals(T + 135000, gameplay().getNextLuckRollNotBeforeEpochMs());
        assertEquals(0, gameplay().getLuckEventsReceived());
        assertEquals(3, gameplay().getLuckRollsTaken());
        assertNull(snapshot().getGameplay().challenge().offer());
    }

    @Test
    void blockedMudIsNegativeAndCountsTowardCapThenPositiveEventResetsGuard() {
        transactions.executeWithoutResult(status -> {
            var state = stateRepository.findByRacePlayerId(secondId).orElseThrow();
            state.setGuardShieldGranted(true);
            state.setGuardShieldCharges(1);
        });
        when(random.nextDouble()).thenReturn(0.0, 0.99, 0.0, 0.99);
        submit(false);
        assertEquals(LuckOutcome.BLOCKED_BY_SHIELD, history().getFirst().getOutcome());
        assertEquals(0, gameplay().getGuardShieldCharges());
        assertTrue(gameplay().getLastLuckWasNegative());
        nextQuestion(T + 45000);
        submit(false);
        assertEquals(LuckEventType.ENERGY_ORB, history().getLast().getAppliedType());
        assertFalse(gameplay().getLastLuckWasNegative());
        nextQuestion(T + 90000);
        submit(false);
        assertEquals(2, history().size());
        assertEquals(2, gameplay().getLuckEventsReceived());
        assertEquals(0, second().getScore());
        verify(random, times(4)).nextDouble();
    }

    @Test
    void strictTabHiddenForfeitUsesExistingTimeoutWithoutLuckOrShield() {
        transactions.executeWithoutResult(status -> raceRepository.findById(raceId).orElseThrow()
                .setFocusPolicy(RaceFocusPolicy.STRICT));
        for (int index = 0; index < 3; index++) {
            focus.recordFocusEvent(secondRequest, focusEvent(RacePlayerFocusEventType.TAB_HIDDEN));
            if (index < 2) focus.recordFocusEvent(secondRequest, focusEvent(RacePlayerFocusEventType.TAB_VISIBLE));
        }
        assertEquals(PlayerQuestionStatus.EXPIRED, question().getStatus());
        assertTrue(history().isEmpty());
        assertEquals(0, gameplay().getGuardShieldCharges());
        verifyNoInteractions(random);
    }

    private RacePlayerFocusEventRequest focusEvent(RacePlayerFocusEventType type) {
        var event = new RacePlayerFocusEventRequest();
        event.setEventId(UUID.randomUUID());
        event.setType(type);
        return event;
    }
}
