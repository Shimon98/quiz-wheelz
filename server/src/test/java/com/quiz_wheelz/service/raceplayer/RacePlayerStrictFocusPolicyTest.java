package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerFocusEventResponse;
import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.RacePlayerFocusEvent;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RaceFocusPolicy;
import com.quiz_wheelz.enums.RacePlayerFocusEventOutcome;
import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import com.quiz_wheelz.enums.RacePlayerFocusState;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class RacePlayerStrictFocusPolicyTest {

    private static final UUID FOURTH_EVENT_ID =
            UUID.fromString("550e8400-e29b-41d4-a716-446655440003");
    private static final UUID FIFTH_EVENT_ID =
            UUID.fromString("550e8400-e29b-41d4-a716-446655440004");

    private RacePlayerFocusEventTestFixture fixture;

    @BeforeEach
    void setUp() {
        fixture = new RacePlayerFocusEventTestFixture();
    }

    @Test
    void offPolicyPersistsIgnoredHiddenWithoutCountingOrQuestionAssociation() {
        RacePlayer racePlayer = fixture.prepareNewEvent(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        racePlayer.getRace().setFocusPolicy(RaceFocusPolicy.OFF);

        RacePlayerFocusEventResponse first = record(
                RacePlayerFocusEventTestFixture.EVENT_ID,
                RacePlayerFocusEventType.TAB_HIDDEN
        );
        RacePlayerFocusEventResponse repeated = record(
                RacePlayerFocusEventTestFixture.SECOND_EVENT_ID,
                RacePlayerFocusEventType.TAB_HIDDEN
        );

        assertEquals(RacePlayerFocusEventOutcome.IGNORED, first.getOutcome());
        assertEquals(RacePlayerFocusEventOutcome.IGNORED, repeated.getOutcome());
        assertEquals(0, repeated.getFocusLossCount());
        assertEquals(0, repeated.getQuestionFocusLossCount());
        assertNull(repeated.getActiveQuestionId());
        assertEquals(RacePlayerFocusState.HIDDEN, racePlayer.getFocusState());
        assertNull(racePlayer.getLastFocusLossAt());
        verifyNoInteractions(fixture.playerQuestionRepository);
        verifyNoInteractions(fixture.gameplayPresenceService);
        verifyNoInteractions(fixture.questionTimeoutService);
    }

    @Test
    void warnPolicyKeepsThirdSameQuestionLossAsViolationWithoutForfeit() {
        RacePlayer racePlayer = preparePolicyRace(RaceFocusPolicy.WARN);
        PlayerQuestion question = fixture.prepareActiveQuestion(racePlayer);
        configureDurableEventStore();

        RacePlayerFocusEventResponse first = recordHiddenVisible(
                RacePlayerFocusEventTestFixture.EVENT_ID,
                RacePlayerFocusEventTestFixture.SECOND_EVENT_ID
        );
        RacePlayerFocusEventResponse second = recordHiddenVisible(
                RacePlayerFocusEventTestFixture.THIRD_EVENT_ID,
                FOURTH_EVENT_ID
        );
        RacePlayerFocusEventResponse third = record(
                FIFTH_EVENT_ID,
                RacePlayerFocusEventType.TAB_HIDDEN
        );

        assertEquals(RacePlayerFocusEventOutcome.WARNING, first.getOutcome());
        assertEquals(RacePlayerFocusEventOutcome.VIOLATION, second.getOutcome());
        assertEquals(RacePlayerFocusEventOutcome.VIOLATION, third.getOutcome());
        assertEquals(3, third.getQuestionFocusLossCount());
        assertEquals(3, racePlayer.getFocusLossCount());
        assertEquals(PlayerQuestionStatus.ACTIVE, question.getStatus());
        verifyNoInteractions(fixture.gameplayPresenceService);
        verifyNoInteractions(fixture.questionTimeoutService);
    }

    @Test
    void strictThirdSameQuestionLossForfeitsOnceAtTrustedCutoff() {
        RacePlayer racePlayer = preparePolicyRace(RaceFocusPolicy.STRICT);
        PlayerQuestion question = fixture.prepareActiveQuestion(racePlayer);
        configureDurableEventStore();
        long movementCutoffEpochMs = RacePlayerFocusEventTestFixture.NOW
                .minusSeconds(45)
                .toEpochMilli();
        when(fixture.gameplayPresenceService.resolveUntrustedActivityCutoff(
                racePlayer,
                RacePlayerFocusEventTestFixture.NOW
        )).thenReturn(movementCutoffEpochMs);
        doAnswer(invocation -> {
            question.setStatus(PlayerQuestionStatus.EXPIRED);
            racePlayer.setSpeed(0.8);
            racePlayer.setWrongAnswers(1);
            return null;
        }).when(fixture.questionTimeoutService).forfeitActiveQuestionAsTimeout(
                racePlayer,
                question,
                RacePlayerFocusEventTestFixture.NOW.toEpochMilli(),
                movementCutoffEpochMs
        );

        RacePlayerFocusEventResponse first = recordHiddenVisible(
                RacePlayerFocusEventTestFixture.EVENT_ID,
                RacePlayerFocusEventTestFixture.SECOND_EVENT_ID
        );
        RacePlayerFocusEventResponse second = recordHiddenVisible(
                RacePlayerFocusEventTestFixture.THIRD_EVENT_ID,
                FOURTH_EVENT_ID
        );
        RacePlayerFocusEventResponse third = record(
                FIFTH_EVENT_ID,
                RacePlayerFocusEventType.TAB_HIDDEN
        );

        assertEquals(RacePlayerFocusEventOutcome.WARNING, first.getOutcome());
        assertEquals(RacePlayerFocusEventOutcome.VIOLATION, second.getOutcome());
        assertEquals(RacePlayerFocusEventOutcome.FORFEITED, third.getOutcome());
        assertEquals(3, third.getFocusLossCount());
        assertEquals(3, third.getQuestionFocusLossCount());
        assertEquals(PlayerQuestionStatus.EXPIRED, question.getStatus());
        assertEquals(RacePlayerStatus.RACING, racePlayer.getStatus());
        assertEquals(RacePlayerFocusState.HIDDEN, racePlayer.getFocusState());

        ArgumentCaptor<RacePlayerFocusEvent> eventCaptor =
                ArgumentCaptor.forClass(RacePlayerFocusEvent.class);
        verify(fixture.focusEventRepository, times(5)).save(eventCaptor.capture());
        RacePlayerFocusEvent forfeitEvent = eventCaptor.getAllValues().get(4);
        assertEquals(RacePlayerFocusEventOutcome.FORFEITED, forfeitEvent.getOutcome());
        assertTrue(forfeitEvent.getCountedFocusLoss());
        verify(fixture.gameplayPresenceService, never())
                .recordGameplayActivity(any(), any());
        verify(fixture.gameplayPresenceService, never())
                .renewPresenceLease(any(), any());
        verify(fixture.gameplayPresenceService, never()).markOffline(any());
    }

    @Test
    void strictFirstLossOnNewQuestionResetsLocalCountAndKeepsRaceTotal() {
        RacePlayer racePlayer = preparePolicyRace(RaceFocusPolicy.STRICT);
        racePlayer.setFocusLossCount(3);
        racePlayer.setFocusState(RacePlayerFocusState.HIDDEN);
        PlayerQuestion nextQuestion = fixture.createQuestion(
                43L,
                fixture.now().plusSeconds(30)
        );
        when(fixture.playerQuestionRepository
                .findFirstByRacePlayerAndStatusOrderByCreatedAtDesc(any(), any()))
                .thenReturn(Optional.of(nextQuestion));
        configureDurableEventStore();

        record(
                RacePlayerFocusEventTestFixture.EVENT_ID,
                RacePlayerFocusEventType.TAB_VISIBLE
        );
        RacePlayerFocusEventResponse response = record(
                RacePlayerFocusEventTestFixture.SECOND_EVENT_ID,
                RacePlayerFocusEventType.TAB_HIDDEN
        );

        assertEquals(RacePlayerFocusEventOutcome.WARNING, response.getOutcome());
        assertEquals(1, response.getQuestionFocusLossCount());
        assertEquals(4, response.getFocusLossCount());
        assertEquals(43L, response.getActiveQuestionId());
        assertEquals(PlayerQuestionStatus.ACTIVE, nextQuestion.getStatus());
        verifyNoInteractions(fixture.questionTimeoutService);
    }

    @Test
    void replayedStrictThirdLossReturnsHistoricForfeitWithoutSecondConsequence() {
        RacePlayer racePlayer = preparePolicyRace(RaceFocusPolicy.STRICT);
        racePlayer.setFocusLossCount(2);
        PlayerQuestion question = fixture.prepareActiveQuestion(racePlayer);
        Map<String, RacePlayerFocusEvent> events = configureDurableEventStore();
        when(fixture.focusEventRepository
                .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(
                        racePlayer,
                        question
                )).thenReturn(2L);
        long movementCutoffEpochMs = RacePlayerFocusEventTestFixture.NOW
                .minusSeconds(45)
                .toEpochMilli();
        when(fixture.gameplayPresenceService.resolveUntrustedActivityCutoff(
                racePlayer,
                RacePlayerFocusEventTestFixture.NOW
        )).thenReturn(movementCutoffEpochMs);
        doAnswer(invocation -> {
            question.setStatus(PlayerQuestionStatus.EXPIRED);
            racePlayer.setSpeed(0.8);
            return null;
        }).when(fixture.questionTimeoutService).forfeitActiveQuestionAsTimeout(
                racePlayer,
                question,
                RacePlayerFocusEventTestFixture.NOW.toEpochMilli(),
                movementCutoffEpochMs
        );

        RacePlayerFocusEventResponse first = record(
                FIFTH_EVENT_ID,
                RacePlayerFocusEventType.TAB_HIDDEN
        );
        RacePlayerFocusEventResponse replay = record(
                FIFTH_EVENT_ID,
                RacePlayerFocusEventType.TAB_HIDDEN
        );
        ApiException conflict = assertThrows(
                ApiException.class,
                () -> record(FIFTH_EVENT_ID, RacePlayerFocusEventType.TAB_VISIBLE)
        );

        assertEquals(RacePlayerFocusEventOutcome.FORFEITED, first.getOutcome());
        assertEquals(first.getOutcome(), replay.getOutcome());
        assertEquals(first.getFocusLossCount(), replay.getFocusLossCount());
        assertEquals(first.getQuestionFocusLossCount(), replay.getQuestionFocusLossCount());
        assertEquals(first.getActiveQuestionId(), replay.getActiveQuestionId());
        assertEquals(first.getRecordedAtEpochMs(), replay.getRecordedAtEpochMs());
        assertEquals(ErrorCode.FOCUS_EVENT_REPLAY_CONFLICT, conflict.getErrorCode());
        assertEquals(1, events.size());
        assertEquals(3, racePlayer.getFocusLossCount());
        assertEquals(0.8, racePlayer.getSpeed());
        verify(fixture.questionTimeoutService, times(1))
                .forfeitActiveQuestionAsTimeout(any(), any(), anyLong(), anyLong());
        verify(fixture.gameplayPresenceService, times(1))
                .resolveUntrustedActivityCutoff(racePlayer, RacePlayerFocusEventTestFixture.NOW);

        InOrder order = inOrder(
                fixture.sessionLockService,
                fixture.focusEventRepository,
                fixture.questionTimeoutService
        );
        order.verify(fixture.sessionLockService).resolveAndLock(fixture.httpRequest);
        order.verify(fixture.focusEventRepository)
                .findByRacePlayerAndClientEventId(racePlayer, FIFTH_EVENT_ID.toString());
        order.verify(fixture.questionTimeoutService)
                .forfeitActiveQuestionAsTimeout(
                        racePlayer,
                        question,
                        RacePlayerFocusEventTestFixture.NOW.toEpochMilli(),
                        movementCutoffEpochMs
                );
    }

    private RacePlayer preparePolicyRace(RaceFocusPolicy focusPolicy) {
        RacePlayer racePlayer = fixture.prepareNewEvent(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        racePlayer.getRace().setFocusPolicy(focusPolicy);
        return racePlayer;
    }

    private Map<String, RacePlayerFocusEvent> configureDurableEventStore() {
        Map<String, RacePlayerFocusEvent> events = new HashMap<>();
        when(fixture.focusEventRepository.findByRacePlayerAndClientEventId(
                any(),
                anyString()
        )).thenAnswer(invocation -> Optional.ofNullable(
                events.get(invocation.getArgument(1))
        ));
        when(fixture.focusEventRepository.save(any())).thenAnswer(invocation -> {
            RacePlayerFocusEvent event = invocation.getArgument(0);
            events.put(event.getClientEventId(), event);
            return event;
        });
        when(fixture.focusEventRepository
                .countByRacePlayerAndPlayerQuestionAndCountedFocusLossTrue(
                        any(),
                        any()
                )).thenAnswer(invocation -> {
            PlayerQuestion question = invocation.getArgument(1);
            return events.values().stream()
                    .filter(event -> event.getPlayerQuestion() == question)
                    .filter(event -> Boolean.TRUE.equals(event.getCountedFocusLoss()))
                    .count();
        });
        return events;
    }

    private RacePlayerFocusEventResponse recordHiddenVisible(
            UUID hiddenEventId,
            UUID visibleEventId
    ) {
        RacePlayerFocusEventResponse hidden = record(
                hiddenEventId,
                RacePlayerFocusEventType.TAB_HIDDEN
        );
        record(visibleEventId, RacePlayerFocusEventType.TAB_VISIBLE);
        return hidden;
    }

    private RacePlayerFocusEventResponse record(
            UUID eventId,
            RacePlayerFocusEventType type
    ) {
        return fixture.service.recordFocusEvent(
                fixture.httpRequest,
                fixture.request(eventId, type)
        );
    }
}
