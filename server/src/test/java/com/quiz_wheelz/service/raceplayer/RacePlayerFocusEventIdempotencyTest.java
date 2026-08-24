package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerFocusEventResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerFocusEvent;
import com.quiz_wheelz.enums.RacePlayerFocusEventOutcome;
import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import com.quiz_wheelz.enums.RacePlayerFocusState;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class RacePlayerFocusEventIdempotencyTest {

    private RacePlayerFocusEventTestFixture fixture;

    @BeforeEach
    void setUp() {
        fixture = new RacePlayerFocusEventTestFixture();
    }

    @Test
    void sameIdAndTypeReplaysOriginalHistoricResponseWithoutSecondMutation() {
        RacePlayer racePlayer = fixture.createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        PlayerQuestion question = fixture.createQuestion(
                RacePlayerFocusEventTestFixture.QUESTION_ID,
                fixture.now().plusSeconds(30)
        );
        AtomicReference<RacePlayerFocusEvent> stored = new AtomicReference<>();
        when(fixture.sessionLockService.resolveAndLock(fixture.httpRequest))
                .thenReturn(racePlayer);
        when(fixture.focusEventRepository.findByRacePlayerAndClientEventId(
                racePlayer,
                RacePlayerFocusEventTestFixture.EVENT_ID.toString()
        )).thenAnswer(invocation -> Optional.ofNullable(stored.get()));
        when(fixture.playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(
                        racePlayer,
                        com.quiz_wheelz.enums.PlayerQuestionStatus.ACTIVE
                )).thenReturn(Optional.of(question));
        when(fixture.focusEventRepository
                .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(
                        racePlayer,
                        question
                )).thenReturn(0L);
        when(fixture.focusEventRepository.save(any())).thenAnswer(invocation -> {
            RacePlayerFocusEvent event = invocation.getArgument(0);
            stored.set(event);
            return event;
        });

        RacePlayerFocusEventResponse first = record(RacePlayerFocusEventType.TAB_HIDDEN);
        racePlayer.setFocusLossCount(99);
        racePlayer.setFocusState(RacePlayerFocusState.VISIBLE);
        RacePlayerFocusEventResponse replay = record(RacePlayerFocusEventType.TAB_HIDDEN);

        assertEquals(RacePlayerFocusEventOutcome.WARNING, first.getOutcome());
        assertEquals(first.getOutcome(), replay.getOutcome());
        assertEquals(1, replay.getFocusLossCount());
        assertEquals(1, replay.getQuestionFocusLossCount());
        assertEquals(first.getRecordedAtEpochMs(), replay.getRecordedAtEpochMs());
        assertEquals(99, racePlayer.getFocusLossCount());
        assertEquals(RacePlayerFocusState.VISIBLE, racePlayer.getFocusState());
        verify(fixture.focusEventRepository, times(1)).save(any());
        verify(fixture.playerQuestionRepository, times(1))
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(any(), any());
        verify(fixture.focusEventRepository, times(1))
                .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(
                        racePlayer,
                        question
                );

        InOrder order = inOrder(
                fixture.sessionLockService,
                fixture.focusEventRepository
        );
        order.verify(fixture.sessionLockService).resolveAndLock(fixture.httpRequest);
        order.verify(fixture.focusEventRepository)
                .findByRacePlayerAndClientEventId(
                        racePlayer,
                        RacePlayerFocusEventTestFixture.EVENT_ID.toString()
                );
    }

    @Test
    void sameIdWithDifferentTypeIsRejectedWithoutStateChange() {
        RacePlayer racePlayer = fixture.createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        racePlayer.setFocusLossCount(3);
        racePlayer.setFocusState(RacePlayerFocusState.HIDDEN);
        RacePlayerFocusEvent existing = historicEvent(racePlayer);
        when(fixture.sessionLockService.resolveAndLock(fixture.httpRequest))
                .thenReturn(racePlayer);
        when(fixture.focusEventRepository.findByRacePlayerAndClientEventId(
                racePlayer,
                RacePlayerFocusEventTestFixture.EVENT_ID.toString()
        )).thenReturn(Optional.of(existing));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> record(RacePlayerFocusEventType.TAB_VISIBLE)
        );

        assertEquals(ErrorCode.FOCUS_EVENT_REPLAY_CONFLICT, exception.getErrorCode());
        assertEquals(3, racePlayer.getFocusLossCount());
        assertEquals(RacePlayerFocusState.HIDDEN, racePlayer.getFocusState());
        verify(fixture.focusEventRepository, never()).save(any());
        verifyNoInteractions(fixture.playerQuestionRepository);
    }

    @Test
    void replayUsesStoredQuestionAssociationCountersAndTimestamp() {
        RacePlayer racePlayer = fixture.createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        racePlayer.setFocusLossCount(8);
        RacePlayerFocusEvent existing = historicEvent(racePlayer);
        when(fixture.sessionLockService.resolveAndLock(fixture.httpRequest))
                .thenReturn(racePlayer);
        when(fixture.focusEventRepository.findByRacePlayerAndClientEventId(
                racePlayer,
                RacePlayerFocusEventTestFixture.EVENT_ID.toString()
        )).thenReturn(Optional.of(existing));

        RacePlayerFocusEventResponse response = record(
                RacePlayerFocusEventType.TAB_HIDDEN
        );

        assertEquals(RacePlayerFocusEventOutcome.WARNING, response.getOutcome());
        assertEquals(1, response.getFocusLossCount());
        assertEquals(1, response.getQuestionFocusLossCount());
        assertEquals(RacePlayerFocusEventTestFixture.QUESTION_ID, response.getActiveQuestionId());
        assertEquals(
                RacePlayerFocusEventTestFixture.NOW.minusSeconds(60).toEpochMilli(),
                response.getRecordedAtEpochMs()
        );
        verify(fixture.focusEventRepository, never()).save(any());
        verifyNoInteractions(fixture.playerQuestionRepository);
    }

    private RacePlayerFocusEventResponse record(RacePlayerFocusEventType type) {
        return fixture.service.recordFocusEvent(
                fixture.httpRequest,
                fixture.request(RacePlayerFocusEventTestFixture.EVENT_ID, type)
        );
    }

    private RacePlayerFocusEvent historicEvent(RacePlayer racePlayer) {
        PlayerQuestion question = fixture.createQuestion(
                RacePlayerFocusEventTestFixture.QUESTION_ID,
                fixture.now().plusSeconds(30)
        );
        RacePlayerFocusEvent event = new RacePlayerFocusEvent();
        event.setRacePlayer(racePlayer);
        event.setClientEventId(RacePlayerFocusEventTestFixture.EVENT_ID.toString());
        event.setType(RacePlayerFocusEventType.TAB_HIDDEN);
        event.setPlayerQuestion(question);
        event.setOutcome(RacePlayerFocusEventOutcome.WARNING);
        event.setCountedFocusLoss(true);
        event.setFocusLossCountAfter(1);
        event.setQuestionFocusLossCountAfter(1);
        event.setRecordedAt(fixture.now().minusSeconds(60));
        return event;
    }
}
