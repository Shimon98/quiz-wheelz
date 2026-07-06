package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentRaceStateResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentRaceStateServiceTest {

    private static final long RACE_ID = 1L;
    private static final String RACE_TITLE = "Easy multiplication";
    private static final String ROOM_CODE = "ABC123";

    @Mock
    private CurrentRacePlayerService currentRacePlayerService;

    @Mock
    private HttpServletRequest request;

    @Test
    void getRaceStateShouldUseSessionResolverAndReturnRaceMetadataAndSnapshot() {
        RacePlayer racePlayer = createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(racePlayer);

        StudentRaceStateResponse response = createService().getRaceState(request);

        assertEquals(RACE_ID, response.getRaceId());
        assertEquals(RACE_TITLE, response.getRaceTitle());
        assertEquals(ROOM_CODE, response.getRoomCode());
        assertSame(racePlayer.getRace().getStartedAt(), response.getStartedAt());
        assertSame(racePlayer.getRace().getFinishedAt(), response.getFinishedAt());
        assertEquals(RacePlayerStatus.RACING, response.getSnapshot().getPlayerStatus());
        assertEquals(RaceStatus.IN_PROGRESS, response.getSnapshot().getRaceStatus());
        assertFalse(response.getSnapshot().isPlayerFinished());
        assertFalse(response.getSnapshot().isRaceFinished());

        verify(currentRacePlayerService).resolveCurrentRacePlayerSession(request);
        verify(currentRacePlayerService, never()).resolveCurrentRacePlayer(request);
    }

    @Test
    void getRaceStateShouldSupportWaitingPlayerAndWaitingRace() {
        RacePlayer racePlayer = createRacePlayer(
                RacePlayerStatus.WAITING,
                RaceStatus.WAITING_FOR_PLAYERS
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(racePlayer);

        StudentRaceStateResponse response = createService().getRaceState(request);

        assertEquals(RacePlayerStatus.WAITING, response.getSnapshot().getPlayerStatus());
        assertEquals(RaceStatus.WAITING_FOR_PLAYERS, response.getSnapshot().getRaceStatus());
        assertFalse(response.getSnapshot().isPlayerFinished());
        assertFalse(response.getSnapshot().isRaceFinished());

        verify(currentRacePlayerService).resolveCurrentRacePlayerSession(request);
        verify(currentRacePlayerService, never()).resolveCurrentRacePlayer(request);
    }

    @Test
    void getRaceStateShouldSupportFinishedPlayerAndFinishedRace() {
        RacePlayer racePlayer = createRacePlayer(
                RacePlayerStatus.FINISHED,
                RaceStatus.FINISHED
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(racePlayer);

        StudentRaceStateResponse response = createService().getRaceState(request);

        assertEquals(RacePlayerStatus.FINISHED, response.getSnapshot().getPlayerStatus());
        assertEquals(RaceStatus.FINISHED, response.getSnapshot().getRaceStatus());
        assertTrue(response.getSnapshot().isPlayerFinished());
        assertTrue(response.getSnapshot().isRaceFinished());

        verify(currentRacePlayerService).resolveCurrentRacePlayerSession(request);
        verify(currentRacePlayerService, never()).resolveCurrentRacePlayer(request);
    }

    private StudentRaceStateService createService() {
        return new StudentRaceStateService(
                currentRacePlayerService,
                new StudentRaceRuntimeSnapshotMapper()
        );
    }

    private RacePlayer createRacePlayer(
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus
    ) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setTitle(RACE_TITLE);
        race.setRoomCode(ROOM_CODE);
        race.setStatus(raceStatus);
        race.setTotalDistance(1000);
        race.setStartedAt(LocalDateTime.of(2026, 7, 5, 10, 0));
        race.setFinishedAt(
                raceStatus == RaceStatus.FINISHED
                        ? LocalDateTime.of(2026, 7, 5, 10, 5)
                        : null
        );

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setRace(race);
        racePlayer.setStatus(playerStatus);
        racePlayer.setScore(50);
        racePlayer.setPosition(120.0);
        racePlayer.setSpeed(1.2);
        racePlayer.setStreak(3);
        racePlayer.setHighestStreak(5);
        racePlayer.setCurrentDifficulty(Difficulty.EASY);

        return racePlayer;
    }
}
