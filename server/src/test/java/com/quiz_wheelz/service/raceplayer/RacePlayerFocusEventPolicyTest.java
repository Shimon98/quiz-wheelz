package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerFocusEventResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerFocusEvent;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerFocusEventOutcome;
import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import com.quiz_wheelz.enums.RacePlayerFocusState;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RacePlayerFocusEventPolicyTest {

    private RacePlayerFocusEventTestFixture fixture;

    @BeforeEach
    void setUp() {
        fixture = new RacePlayerFocusEventTestFixture();
    }

    @Test
    void visibleHiddenCountsFirstQuestionLossAsWarningWithoutGameplayMutation() {
        RacePlayer racePlayer = fixture.prepareNewEvent(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        PlayerQuestion question = fixture.prepareActiveQuestion(racePlayer);
        when(fixture.focusEventRepository
                .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(
                        racePlayer,
                        question
                )).thenReturn(0L);

        RacePlayerFocusEventResponse response = fixture.service.recordFocusEvent(
                fixture.httpRequest,
                fixture.request(
                        RacePlayerFocusEventTestFixture.EVENT_ID,
                        RacePlayerFocusEventType.TAB_HIDDEN
                )
        );

        assertEquals(RacePlayerFocusEventOutcome.WARNING, response.getOutcome());
        assertEquals(1, response.getFocusLossCount());
        assertEquals(1, response.getQuestionFocusLossCount());
        assertEquals(RacePlayerFocusEventTestFixture.QUESTION_ID, response.getActiveQuestionId());
        assertEquals(RacePlayerFocusEventTestFixture.NOW.toEpochMilli(), response.getRecordedAtEpochMs());
        assertEquals(RacePlayerFocusState.HIDDEN, racePlayer.getFocusState());
        assertEquals(1, racePlayer.getFocusLossCount());
        assertEquals(fixture.now(), racePlayer.getLastFocusLossAt());
        assertGameplayStateUnchanged(racePlayer, question);

        ArgumentCaptor<RacePlayerFocusEvent> captor =
                ArgumentCaptor.forClass(RacePlayerFocusEvent.class);
        verify(fixture.focusEventRepository).save(captor.capture());
        RacePlayerFocusEvent event = captor.getValue();
        assertSame(racePlayer, event.getRacePlayer());
        assertSame(question, event.getPlayerQuestion());
        assertTrue(event.getCountedFocusLoss());
        assertEquals(RacePlayerFocusEventOutcome.WARNING, event.getOutcome());
        assertEquals(1, event.getFocusLossCountAfter());
        assertEquals(1, event.getQuestionFocusLossCountAfter());
        assertEquals(fixture.now(), event.getRecordedAt());
    }

    @Test
    void hiddenVisibleThenHiddenOnSameQuestionBecomesViolation() {
        RacePlayer racePlayer = fixture.prepareNewEvent(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        PlayerQuestion question = fixture.prepareActiveQuestion(racePlayer);
        when(fixture.focusEventRepository
                .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(
                        racePlayer,
                        question
                )).thenReturn(0L).thenReturn(1L).thenReturn(1L);

        RacePlayerFocusEventResponse first = record(
                RacePlayerFocusEventTestFixture.EVENT_ID,
                RacePlayerFocusEventType.TAB_HIDDEN
        );
        RacePlayerFocusEventResponse visible = record(
                RacePlayerFocusEventTestFixture.SECOND_EVENT_ID,
                RacePlayerFocusEventType.TAB_VISIBLE
        );
        RacePlayerFocusEventResponse second = record(
                RacePlayerFocusEventTestFixture.THIRD_EVENT_ID,
                RacePlayerFocusEventType.TAB_HIDDEN
        );

        assertEquals(RacePlayerFocusEventOutcome.WARNING, first.getOutcome());
        assertEquals(RacePlayerFocusEventOutcome.VISIBLE, visible.getOutcome());
        assertEquals(1, visible.getFocusLossCount());
        assertEquals(RacePlayerFocusEventOutcome.VIOLATION, second.getOutcome());
        assertEquals(2, second.getFocusLossCount());
        assertEquals(2, second.getQuestionFocusLossCount());
        assertEquals(RacePlayerFocusState.HIDDEN, racePlayer.getFocusState());
        verify(fixture.focusEventRepository, times(3)).save(
                org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void firstLossOnNewQuestionResetsQuestionCountButKeepsRaceTotal() {
        RacePlayer racePlayer = fixture.prepareNewEvent(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        racePlayer.setFocusLossCount(2);
        LocalDateTime previousLossAt = fixture.now().minusMinutes(1);
        racePlayer.setLastFocusLossAt(previousLossAt);
        PlayerQuestion nextQuestion = fixture.createQuestion(43L, fixture.now().plusSeconds(30));
        when(fixture.playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        racePlayer,
                        PlayerQuestionStatus.ACTIVE
                )).thenReturn(java.util.Optional.of(nextQuestion));
        when(fixture.focusEventRepository
                .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(
                        racePlayer,
                        nextQuestion
                )).thenReturn(0L);

        RacePlayerFocusEventResponse response = record(
                RacePlayerFocusEventTestFixture.EVENT_ID,
                RacePlayerFocusEventType.TAB_HIDDEN
        );

        assertEquals(RacePlayerFocusEventOutcome.WARNING, response.getOutcome());
        assertEquals(3, response.getFocusLossCount());
        assertEquals(1, response.getQuestionFocusLossCount());
        assertEquals(43L, response.getActiveQuestionId());
        assertEquals(3, racePlayer.getFocusLossCount());
        assertEquals(fixture.now(), racePlayer.getLastFocusLossAt());
    }

    @Test
    void differentHiddenEventWhileAlreadyHiddenIsPersistedButIgnored() {
        RacePlayer racePlayer = fixture.prepareNewEvent(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        PlayerQuestion question = fixture.prepareActiveQuestion(racePlayer);
        when(fixture.focusEventRepository
                .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(
                        racePlayer,
                        question
                )).thenReturn(0L).thenReturn(1L);

        record(
                RacePlayerFocusEventTestFixture.EVENT_ID,
                RacePlayerFocusEventType.TAB_HIDDEN
        );
        LocalDateTime firstLossAt = racePlayer.getLastFocusLossAt();
        RacePlayerFocusEventResponse ignored = record(
                RacePlayerFocusEventTestFixture.SECOND_EVENT_ID,
                RacePlayerFocusEventType.TAB_HIDDEN
        );

        assertEquals(RacePlayerFocusEventOutcome.IGNORED, ignored.getOutcome());
        assertEquals(1, ignored.getFocusLossCount());
        assertEquals(1, ignored.getQuestionFocusLossCount());
        assertEquals(1, racePlayer.getFocusLossCount());
        assertEquals(firstLossAt, racePlayer.getLastFocusLossAt());

        ArgumentCaptor<RacePlayerFocusEvent> captor =
                ArgumentCaptor.forClass(RacePlayerFocusEvent.class);
        verify(fixture.focusEventRepository, times(2)).save(captor.capture());
        List<RacePlayerFocusEvent> events = captor.getAllValues();
        assertTrue(events.get(0).getCountedFocusLoss());
        assertFalse(events.get(1).getCountedFocusLoss());
    }

    @Test
    void repeatedVisibleEventsAreSafeAndDoNotEraseCounters() {
        RacePlayer racePlayer = fixture.prepareNewEvent(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        PlayerQuestion question = fixture.prepareActiveQuestion(racePlayer);
        LocalDateTime previousLossAt = fixture.now().minusMinutes(2);
        racePlayer.setFocusLossCount(2);
        racePlayer.setLastFocusLossAt(previousLossAt);
        when(fixture.focusEventRepository
                .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(
                        racePlayer,
                        question
                )).thenReturn(2L);

        RacePlayerFocusEventResponse first = record(
                RacePlayerFocusEventTestFixture.EVENT_ID,
                RacePlayerFocusEventType.TAB_VISIBLE
        );
        RacePlayerFocusEventResponse second = record(
                RacePlayerFocusEventTestFixture.SECOND_EVENT_ID,
                RacePlayerFocusEventType.TAB_VISIBLE
        );

        assertEquals(RacePlayerFocusEventOutcome.VISIBLE, first.getOutcome());
        assertEquals(RacePlayerFocusEventOutcome.VISIBLE, second.getOutcome());
        assertEquals(2, second.getFocusLossCount());
        assertEquals(2, second.getQuestionFocusLossCount());
        assertEquals(RacePlayerFocusState.VISIBLE, racePlayer.getFocusState());
        assertEquals(2, racePlayer.getFocusLossCount());
        assertEquals(previousLossAt, racePlayer.getLastFocusLossAt());
    }

    private RacePlayerFocusEventResponse record(
            java.util.UUID eventId,
            RacePlayerFocusEventType type
    ) {
        return fixture.service.recordFocusEvent(
                fixture.httpRequest,
                fixture.request(eventId, type)
        );
    }

    private void assertGameplayStateUnchanged(
            RacePlayer racePlayer,
            PlayerQuestion question
    ) {
        assertEquals(50, racePlayer.getScore());
        assertEquals(120.0, racePlayer.getPosition());
        assertEquals(1.2, racePlayer.getSpeed());
        assertEquals(3, racePlayer.getStreak());
        assertEquals(Difficulty.EASY, racePlayer.getCurrentDifficulty());
        assertEquals(PlayerQuestionStatus.ACTIVE, question.getStatus());
        assertNull(question.getAnsweredAt());
    }
}
