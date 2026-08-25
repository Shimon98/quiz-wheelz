package com.quiz_wheelz.service.liveevent;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
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
}
