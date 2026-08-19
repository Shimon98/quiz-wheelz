package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.StudentRaceStateResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.service.raceengine.RaceFinishService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentRaceStateServiceTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-06-30T10:00:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("UTC");
    private static final long RACE_ID = 1L;
    private static final long RACE_PLAYER_ID = 9L;
    private static final String RACE_TITLE = "Easy multiplication";
    private static final String ROOM_CODE = "ABC123";

    @Mock
    private CurrentRacePlayerService currentRacePlayerService;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private QuestionTimeoutService questionTimeoutService;

    @Mock
    private RaceFinishService raceFinishService;

    @Mock
    private HttpServletRequest request;

    @Test
    void getRaceStateShouldLockSettleAndReturnRaceMetadataAndSnapshot() {
        RacePlayer racePlayer = mockResolvedAndLocked(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );

        StudentRaceStateResponse response = createService().getRaceState(request);

        assertEquals(RACE_ID, response.getRaceId());
        assertEquals(RACE_TITLE, response.getRaceTitle());
        assertEquals(ROOM_CODE, response.getRoomCode());
        assertSame(racePlayer.getRace().getStartedAt(), response.getStartedAt());
        assertSame(racePlayer.getRace().getFinishedAt(), response.getFinishedAt());
        assertEquals(RACE_PLAYER_ID, response.getPlayer().getRacePlayerId());
        assertEquals("Noa", response.getPlayer().getDisplayName());
        assertEquals(3, response.getPlayer().getLaneNumber());
        assertEquals("HOVER_KART", response.getPlayer().getVehicleTypeKey());
        assertEquals("GREEN", response.getPlayer().getVehicleColorKey());
        assertEquals("HOVER_KART_GREEN", response.getPlayer().getVehicleAssetKey());
        assertEquals(RacePlayerStatus.RACING, response.getSnapshot().getPlayerStatus());
        assertEquals(RaceStatus.IN_PROGRESS, response.getSnapshot().getRaceStatus());
        assertFalse(response.getSnapshot().isPlayerFinished());
        assertFalse(response.getSnapshot().isRaceFinished());
        assertEquals(
                FIXED_INSTANT.toEpochMilli(),
                response.getSnapshot().getSnapshotAtEpochMs()
        );
        // speed 1.2 x BASE_MOVEMENT_UNITS_PER_SECOND 4.0
        assertEquals(4.8, response.getSnapshot().getMovementUnitsPerSecond());

        // The snapshot describes SETTLED movement — locked + settled first.
        verify(racePlayerRepository).findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        verify(questionTimeoutService).settleWithOverdueTimeout(
                racePlayer,
                LocalDateTime.ofInstant(FIXED_INSTANT, FIXED_ZONE),
                FIXED_INSTANT.toEpochMilli()
        );
        verify(raceFinishService, never()).finishRaceIfNeeded(any());
        verify(currentRacePlayerService, never()).resolveCurrentRacePlayer(request);
    }

    @Test
    void getRaceStateShouldSupportWaitingPlayerAndWaitingRace() {
        mockResolvedAndLocked(
                RacePlayerStatus.WAITING,
                RaceStatus.WAITING_FOR_PLAYERS
        );

        StudentRaceStateResponse response = createService().getRaceState(request);

        assertEquals(RacePlayerStatus.WAITING, response.getSnapshot().getPlayerStatus());
        assertEquals(RaceStatus.WAITING_FOR_PLAYERS, response.getSnapshot().getRaceStatus());
        assertFalse(response.getSnapshot().isPlayerFinished());
        assertFalse(response.getSnapshot().isRaceFinished());
        verify(raceFinishService, never()).finishRaceIfNeeded(any());
    }

    @Test
    void getRaceStateShouldSupportFinishedPlayerAndFinishedRace() {
        mockResolvedAndLocked(
                RacePlayerStatus.FINISHED,
                RaceStatus.FINISHED
        );

        StudentRaceStateResponse response = createService().getRaceState(request);

        assertEquals(RacePlayerStatus.FINISHED, response.getSnapshot().getPlayerStatus());
        assertEquals(RaceStatus.FINISHED, response.getSnapshot().getRaceStatus());
        assertTrue(response.getSnapshot().isPlayerFinished());
        assertTrue(response.getSnapshot().isRaceFinished());
        // Already-finished before this read — no race finalization attempt.
        verify(raceFinishService, never()).finishRaceIfNeeded(any());
    }

    @Test
    void getRaceStateShouldCheckRaceFinishWhenSettlementFinishesThePlayer() {
        RacePlayer racePlayer = mockResolvedAndLocked(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );

        // The settlement crosses the finish line during this read.
        doAnswer(invocation -> {
            racePlayer.setStatus(RacePlayerStatus.FINISHED);
            return null;
        }).when(questionTimeoutService).settleWithOverdueTimeout(
                any(),
                any(),
                org.mockito.ArgumentMatchers.anyLong()
        );

        StudentRaceStateResponse response = createService().getRaceState(request);

        assertTrue(response.getSnapshot().isPlayerFinished());
        verify(raceFinishService).finishRaceIfNeeded(racePlayer.getRace());
    }

    @Test
    void getRaceStateShouldRejectPlayerThatCannotBeLocked() {
        RacePlayer racePlayer = createRacePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(racePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.empty());

        ApiException exception = assertThrows(
                ApiException.class,
                () -> createService().getRaceState(request)
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_FOUND, exception.getErrorCode());
    }

    private StudentRaceStateService createService() {
        return new StudentRaceStateService(
                currentRacePlayerService,
                racePlayerRepository,
                questionTimeoutService,
                raceFinishService,
                new StudentRaceRuntimeSnapshotMapper(),
                Clock.fixed(FIXED_INSTANT, FIXED_ZONE)
        );
    }

    private RacePlayer mockResolvedAndLocked(
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus
    ) {
        RacePlayer racePlayer = createRacePlayer(playerStatus, raceStatus);

        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(racePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        return racePlayer;
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
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setDisplayName("Noa");
        racePlayer.setLaneNumber(3);
        racePlayer.setVehicleTypeKey("HOVER_KART");
        racePlayer.setVehicleColorKey("GREEN");
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
