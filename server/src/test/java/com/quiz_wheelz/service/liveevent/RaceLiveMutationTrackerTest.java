package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.PlayerLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.RaceLiveState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RaceLiveMutationTrackerTest {

    @Mock
    private RaceLiveMutationGate mutationGate;

    @Mock
    private RaceLiveEventRecorder eventRecorder;

    private RaceLiveMutationTracker tracker;
    private Race race;
    private RacePlayer player;

    @BeforeEach
    void setUp() {
        tracker = new RaceLiveMutationTracker(
                mutationGate,
                new RaceLiveEventChangeRecorder(eventRecorder)
        );
        race = new Race();
        race.setId(7L);
        race.setStatus(RaceStatus.IN_PROGRESS);
        player = new RacePlayer();
        player.setId(11L);
        player.setRace(race);
        player.setStatus(RacePlayerStatus.RACING);
        player.setPosition(10.0);
        player.setSpeed(1.0);
        player.setScore(20);
        player.setStreak(2);
    }

    @Test
    void waitingPlayerReturnsInactiveContextWithoutRaceLockOrEvent() {
        RaceRepository raceRepository = org.mockito.Mockito.mock(RaceRepository.class);
        RaceLiveMutationTracker waitingTracker = new RaceLiveMutationTracker(
                new RaceLiveMutationGate(raceRepository),
                new RaceLiveEventChangeRecorder(eventRecorder)
        );
        player.setStatus(RacePlayerStatus.WAITING);

        RaceLiveMutationContext context = waitingTracker.begin(player);
        waitingTracker.recordChanges(context, player);

        assertFalse(context.active());
        verifyNoInteractions(raceRepository, eventRecorder);
    }

    @Test
    void activeBeginAcquiresGateBeforeCapturingBeforeState() {
        RaceLiveEventChangeRecorder changeRecorder =
                org.mockito.Mockito.mock(RaceLiveEventChangeRecorder.class);
        RaceLiveMutationTracker orderedTracker = new RaceLiveMutationTracker(
                mutationGate,
                changeRecorder
        );
        PlayerLiveState playerBefore = new PlayerLiveState(
                10.0,
                1.0,
                20,
                2,
                RacePlayerStatus.RACING,
                null
        );
        RaceLiveState raceBefore = new RaceLiveState(RaceStatus.IN_PROGRESS, null);
        when(mutationGate.lockIfActive(player)).thenReturn(Optional.of(race));
        when(changeRecorder.capturePlayer(player)).thenReturn(playerBefore);
        when(changeRecorder.captureRace(race)).thenReturn(raceBefore);

        RaceLiveMutationContext context = orderedTracker.begin(player);

        assertTrue(context.active());
        assertSame(race, context.activeRace());
        assertSame(playerBefore, context.playerBefore());
        assertSame(raceBefore, context.raceBefore());
        InOrder order = inOrder(mutationGate, changeRecorder);
        order.verify(mutationGate).lockIfActive(player);
        order.verify(changeRecorder).capturePlayer(player);
        order.verify(changeRecorder).captureRace(race);
    }

    @Test
    void noVisibleChangeRecordsNoEvent() {
        RaceLiveMutationContext context = beginActive();

        tracker.recordChanges(context, player);

        verifyNoInteractions(eventRecorder);
    }

    @Test
    void nonTerminalVisibleChangeRecordsOneProgressEvent() {
        RaceLiveMutationContext context = beginActive();
        player.setPosition(12.0);

        tracker.recordChanges(context, player);

        verify(eventRecorder).recordPlayerProgressUpdated(race);
        verify(eventRecorder, never()).recordPlayerFinished(player);
    }

    @Test
    void playerFinishedTransitionRecordsOneTerminalEventWithoutProgress() {
        RaceLiveMutationContext context = beginActive();
        player.setStatus(RacePlayerStatus.FINISHED);
        player.setFinishedAt(LocalDateTime.of(2026, 8, 25, 10, 0));

        tracker.recordChanges(context, player);

        verify(eventRecorder).recordPlayerFinished(player);
        verify(eventRecorder, never()).recordPlayerProgressUpdated(race);
    }

    @Test
    void raceFinishedTransitionRecordsOneRaceTerminalEvent() {
        RaceLiveMutationContext context = beginActive();
        race.setStatus(RaceStatus.FINISHED);
        race.setFinishedAt(LocalDateTime.of(2026, 8, 25, 10, 1));

        tracker.recordChanges(context, player);

        verify(eventRecorder).recordRaceFinished(race);
    }

    private RaceLiveMutationContext beginActive() {
        when(mutationGate.lockIfActive(player)).thenReturn(Optional.of(race));
        return tracker.begin(player);
    }
}
