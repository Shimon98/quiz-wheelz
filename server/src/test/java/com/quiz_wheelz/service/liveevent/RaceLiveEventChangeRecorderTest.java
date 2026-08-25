package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class RaceLiveEventChangeRecorderTest {

    @Mock
    private RaceLiveEventRecorder eventRecorder;

    private RaceLiveEventChangeRecorder changeRecorder;
    private Race race;
    private RacePlayer player;

    @BeforeEach
    void setUp() {
        changeRecorder = new RaceLiveEventChangeRecorder(eventRecorder);
        race = new Race();
        race.setStatus(RaceStatus.IN_PROGRESS);
        player = new RacePlayer();
        player.setRace(race);
        player.setStatus(RacePlayerStatus.RACING);
        player.setPosition(10.0);
        player.setSpeed(4.0);
        player.setScore(20);
        player.setStreak(2);
    }

    @Test
    void meaningfulVisibleChangeRecordsOneFullProgressEvent() {
        RaceLiveEventChangeRecorder.PlayerLiveState before =
                changeRecorder.capturePlayer(player);
        player.setPosition(12.0);

        changeRecorder.recordPlayerChange(before, player);

        verify(eventRecorder).recordPlayerProgressUpdated(race);
        verify(eventRecorder, never()).recordPlayerFinished(player);
    }

    @Test
    void noVisibleChangeRecordsNothing() {
        RaceLiveEventChangeRecorder.PlayerLiveState before =
                changeRecorder.capturePlayer(player);

        changeRecorder.recordPlayerChange(before, player);

        verifyNoInteractions(eventRecorder);
    }

    @Test
    void disconnectTransitionRecordsProgressOnlyOnce() {
        RaceLiveEventChangeRecorder.PlayerLiveState racing =
                changeRecorder.capturePlayer(player);
        player.setStatus(RacePlayerStatus.DISCONNECTED);

        changeRecorder.recordPlayerChange(racing, player);
        RaceLiveEventChangeRecorder.PlayerLiveState disconnected =
                changeRecorder.capturePlayer(player);
        changeRecorder.recordPlayerChange(disconnected, player);

        verify(eventRecorder).recordPlayerProgressUpdated(race);
        verify(eventRecorder, never()).recordPlayerFinished(player);
    }

    @Test
    void playerFinishTransitionRecordsTerminalEventExactlyOnce() {
        RaceLiveEventChangeRecorder.PlayerLiveState racing =
                changeRecorder.capturePlayer(player);
        player.setStatus(RacePlayerStatus.FINISHED);
        player.setFinishedAt(LocalDateTime.of(2026, 8, 24, 18, 0));

        changeRecorder.recordPlayerChange(racing, player);
        RaceLiveEventChangeRecorder.PlayerLiveState finished =
                changeRecorder.capturePlayer(player);
        changeRecorder.recordPlayerChange(finished, player);

        verify(eventRecorder).recordPlayerFinished(player);
        verify(eventRecorder, never()).recordPlayerProgressUpdated(race);
    }

    @Test
    void raceFinishTransitionRecordsTerminalEventExactlyOnce() {
        RaceLiveEventChangeRecorder.RaceLiveState active =
                changeRecorder.captureRace(race);
        race.setStatus(RaceStatus.FINISHED);
        race.setFinishedAt(LocalDateTime.of(2026, 8, 24, 18, 1));

        changeRecorder.recordRaceChange(active, race);
        RaceLiveEventChangeRecorder.RaceLiveState finished =
                changeRecorder.captureRace(race);
        changeRecorder.recordRaceChange(finished, race);

        verify(eventRecorder).recordRaceFinished(race);
    }

    @Test
    void finalizationCoalescesMultipleNonTerminalChangesIntoOneProgressEvent() {
        RacePlayer secondPlayer = player(12L);
        RaceLiveEventChangeRecorder.PlayerChange firstChange =
                new RaceLiveEventChangeRecorder.PlayerChange(
                        changeRecorder.capturePlayer(player),
                        player
                );
        RaceLiveEventChangeRecorder.PlayerChange secondChange =
                new RaceLiveEventChangeRecorder.PlayerChange(
                        changeRecorder.capturePlayer(secondPlayer),
                        secondPlayer
                );
        player.setStatus(RacePlayerStatus.DISCONNECTED);
        secondPlayer.setStatus(RacePlayerStatus.DISCONNECTED);

        changeRecorder.recordFinalizationPlayerChanges(
                race,
                List.of(firstChange, secondChange)
        );

        verify(eventRecorder, times(1)).recordPlayerProgressUpdated(race);
        verify(eventRecorder, never()).recordPlayerFinished(player);
        verify(eventRecorder, never()).recordPlayerFinished(secondPlayer);
    }

    @Test
    void finalizationPreservesEachFinishedTransitionWithoutRedundantProgress() {
        RacePlayer secondPlayer = player(12L);
        RaceLiveEventChangeRecorder.PlayerChange firstChange =
                new RaceLiveEventChangeRecorder.PlayerChange(
                        changeRecorder.capturePlayer(player),
                        player
                );
        RaceLiveEventChangeRecorder.PlayerChange secondChange =
                new RaceLiveEventChangeRecorder.PlayerChange(
                        changeRecorder.capturePlayer(secondPlayer),
                        secondPlayer
                );
        player.setStatus(RacePlayerStatus.FINISHED);
        secondPlayer.setStatus(RacePlayerStatus.FINISHED);

        changeRecorder.recordFinalizationPlayerChanges(
                race,
                List.of(firstChange, secondChange)
        );

        verify(eventRecorder).recordPlayerFinished(player);
        verify(eventRecorder).recordPlayerFinished(secondPlayer);
        verify(eventRecorder, never()).recordPlayerProgressUpdated(race);
    }

    @Test
    void finalizationEmitsFinishedBeforeProgressWhenFinishedAppearsFirst() {
        RacePlayer finished = player(12L);
        RacePlayer progressed = player(13L);
        RaceLiveEventChangeRecorder.PlayerChange finishedChange = change(finished);
        RaceLiveEventChangeRecorder.PlayerChange progressChange = change(progressed);
        finished.setStatus(RacePlayerStatus.FINISHED);
        progressed.setStatus(RacePlayerStatus.DISCONNECTED);

        changeRecorder.recordFinalizationPlayerChanges(
                race,
                List.of(finishedChange, progressChange)
        );

        InOrder eventOrder = inOrder(eventRecorder);
        eventOrder.verify(eventRecorder).recordPlayerFinished(finished);
        eventOrder.verify(eventRecorder).recordPlayerProgressUpdated(race);
        verifyNoMoreInteractions(eventRecorder);
    }

    @Test
    void finalizationEmitsFinishedBeforeProgressWhenProgressAppearsFirst() {
        RacePlayer progressed = player(12L);
        RacePlayer finished = player(13L);
        RaceLiveEventChangeRecorder.PlayerChange progressChange = change(progressed);
        RaceLiveEventChangeRecorder.PlayerChange finishedChange = change(finished);
        progressed.setStatus(RacePlayerStatus.DISCONNECTED);
        finished.setStatus(RacePlayerStatus.FINISHED);

        changeRecorder.recordFinalizationPlayerChanges(
                race,
                List.of(progressChange, finishedChange)
        );

        InOrder eventOrder = inOrder(eventRecorder);
        eventOrder.verify(eventRecorder).recordPlayerFinished(finished);
        eventOrder.verify(eventRecorder).recordPlayerProgressUpdated(race);
        verifyNoMoreInteractions(eventRecorder);
    }

    @Test
    void finalizationPreservesFinishedOrderBeforeSingleProgressEvent() {
        RacePlayer progressed = player(12L);
        RacePlayer firstFinished = player(13L);
        RacePlayer secondFinished = player(14L);
        RaceLiveEventChangeRecorder.PlayerChange progressChange = change(progressed);
        RaceLiveEventChangeRecorder.PlayerChange firstFinishedChange = change(firstFinished);
        RaceLiveEventChangeRecorder.PlayerChange secondFinishedChange = change(secondFinished);
        progressed.setStatus(RacePlayerStatus.DISCONNECTED);
        firstFinished.setStatus(RacePlayerStatus.FINISHED);
        secondFinished.setStatus(RacePlayerStatus.FINISHED);

        changeRecorder.recordFinalizationPlayerChanges(
                race,
                List.of(progressChange, firstFinishedChange, secondFinishedChange)
        );

        InOrder eventOrder = inOrder(eventRecorder);
        eventOrder.verify(eventRecorder).recordPlayerFinished(firstFinished);
        eventOrder.verify(eventRecorder).recordPlayerFinished(secondFinished);
        eventOrder.verify(eventRecorder).recordPlayerProgressUpdated(race);
        verifyNoMoreInteractions(eventRecorder);
    }

    private RaceLiveEventChangeRecorder.PlayerChange change(RacePlayer racePlayer) {
        return new RaceLiveEventChangeRecorder.PlayerChange(
                changeRecorder.capturePlayer(racePlayer),
                racePlayer
        );
    }

    private RacePlayer player(Long id) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(id);
        racePlayer.setRace(race);
        racePlayer.setStatus(RacePlayerStatus.RACING);
        racePlayer.setPosition(8.0);
        racePlayer.setSpeed(3.0);
        racePlayer.setScore(10);
        racePlayer.setStreak(1);
        return racePlayer;
    }
}
