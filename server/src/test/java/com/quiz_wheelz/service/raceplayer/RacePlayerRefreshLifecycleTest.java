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
import com.quiz_wheelz.service.raceengine.RaceFinishService;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationGate;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationTracker;
import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerRefreshLifecycleTest {

    private static final Instant NOW = Instant.parse("2026-08-23T12:00:00Z");
    private static final long RACE_ID = 1L;
    private static final long RACE_PLAYER_ID = 9L;

    @Mock
    private RacePlayerSessionLockService sessionLockService;

    @Mock
    private RaceLiveMutationGate liveMutationGate;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private RacePlayerGameplayPresenceService gameplayPresenceService;

    @Mock
    private RacePlayerGameplayTimelineService gameplayTimelineService;

    @Mock
    private RaceFinishService raceFinishService;

    @Mock
    private StudentRaceStandingService standingService;

    @Mock
    private HttpServletRequest request;

    private StudentRaceStateService raceStateService;

    @BeforeEach
    void setUp() {
        RacePlayerGameplayRequestGuard requestGuard =
                new RacePlayerGameplayRequestGuard(
                        gameplayPresenceService,
                        gameplayTimelineService,
                        racePlayerRepository
                );
        raceStateService = new StudentRaceStateService(
                sessionLockService,
                requestGuard,
                raceFinishService,
                standingService,
                new StudentRaceRuntimeSnapshotMapper(),
                new RaceLiveMutationTracker(
                        liveMutationGate,
                        new RaceLiveEventChangeRecorder(mock(RaceLiveEventRecorder.class))
                ),
                Clock.fixed(NOW, ZoneId.of("UTC"))
        );
    }

    @Test
    void repeatedWaitingRefreshIsReadOnlyAndStable() {
        RacePlayer racePlayer = preparePlayer(RacePlayerStatus.WAITING, RaceStatus.READY);

        assertRepeatedSnapshot(racePlayer);

        verifyNoInteractions(gameplayPresenceService, gameplayTimelineService);
        verifyNoMutationSave();
    }

    @Test
    void repeatedWaitingForPlayersRefreshIsReadOnlyAndStable() {
        RacePlayer racePlayer = preparePlayer(
                RacePlayerStatus.WAITING,
                RaceStatus.WAITING_FOR_PLAYERS
        );

        assertRepeatedSnapshot(racePlayer);

        verifyNoInteractions(gameplayPresenceService, gameplayTimelineService);
        verifyNoMutationSave();
    }

    @Test
    void repeatedActiveRefreshUsesGameplaySettlementWithoutReconnectReanchor() {
        RacePlayer racePlayer = preparePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        RacePlayerGameplayPresenceService.GameplayPresenceDecision online =
                new RacePlayerGameplayPresenceService.GameplayPresenceDecision(
                        true,
                        true,
                        false,
                        NOW.toEpochMilli()
                );
        when(gameplayPresenceService.resolve(racePlayer, NOW)).thenReturn(online);

        assertRepeatedSnapshot(racePlayer);

        verify(gameplayTimelineService, times(2)).settleGameplayRequest(
                racePlayer,
                NOW,
                online
        );
        verify(gameplayTimelineService, never()).settleReconnect(any(), any(), any());
        verify(gameplayPresenceService, times(2)).recordGameplayActivity(racePlayer, NOW);
        verify(gameplayPresenceService, never()).renewPresenceLease(any(), any());
        verifyNoMutationSave();
    }

    @Test
    void repeatedAbsentActiveRefreshRequiresExplicitReconnect() {
        RacePlayer racePlayer = preparePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );
        RacePlayerGameplayPresenceService.GameplayPresenceDecision absent =
                new RacePlayerGameplayPresenceService.GameplayPresenceDecision(
                        true,
                        false,
                        false,
                        NOW.minusSeconds(1).toEpochMilli()
                );
        when(gameplayPresenceService.resolve(racePlayer, NOW)).thenReturn(absent);

        for (int attempt = 0; attempt < 2; attempt++) {
            ApiException exception = assertThrows(
                    ApiException.class,
                    () -> raceStateService.getRaceState(request)
            );
            assertEquals(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED, exception.getErrorCode());
        }

        verify(gameplayTimelineService, times(2)).settleGameplayRequest(
                racePlayer,
                NOW,
                absent
        );
        verify(gameplayTimelineService, never()).settleReconnect(any(), any(), any());
        verify(gameplayPresenceService, never()).recordGameplayActivity(any(), any());
        verify(standingService, never()).calculate(any());
        verifyNoMutationSave();
    }

    @Test
    void repeatedFinishedPlayerRefreshIsReadableAndStable() {
        RacePlayer racePlayer = preparePlayer(
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS
        );

        assertRepeatedSnapshot(racePlayer);

        verifyNoInteractions(gameplayPresenceService, gameplayTimelineService);
        verifyNoMutationSave();
    }

    @Test
    void repeatedDisconnectedPlayerRefreshIsReadableAndStable() {
        RacePlayer racePlayer = preparePlayer(
                RacePlayerStatus.DISCONNECTED,
                RaceStatus.IN_PROGRESS
        );

        assertRepeatedSnapshot(racePlayer);

        verifyNoInteractions(gameplayPresenceService, gameplayTimelineService);
        verifyNoMutationSave();
    }

    @Test
    void repeatedFinishedRaceRefreshIsReadableAndStable() {
        RacePlayer racePlayer = preparePlayer(
                RacePlayerStatus.RACING,
                RaceStatus.FINISHED
        );

        assertRepeatedSnapshot(racePlayer);

        verifyNoInteractions(gameplayPresenceService, gameplayTimelineService);
        verifyNoMutationSave();
    }

    private RacePlayer preparePlayer(
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus
    ) {
        RacePlayer racePlayer = createRacePlayer(playerStatus, raceStatus);
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(sessionLockService.resolveIdentity(request)).thenReturn(identity);
        when(sessionLockService.lock(identity)).thenReturn(racePlayer);
        lenient().when(liveMutationGate.lockIfActive(racePlayer)).thenReturn(
                playerStatus == RacePlayerStatus.RACING
                        && raceStatus == RaceStatus.IN_PROGRESS
                        ? Optional.of(racePlayer.getRace())
                        : Optional.empty()
        );
        lenient().when(standingService.calculate(racePlayer))
                .thenReturn(new StudentRaceStandingResult(1, 1, List.of()));
        return racePlayer;
    }

    private void assertRepeatedSnapshot(RacePlayer racePlayer) {
        StudentRaceStateResponse first = raceStateService.getRaceState(request);
        StudentRaceStateResponse second = raceStateService.getRaceState(request);

        assertEquals(first.getPlayer().getRacePlayerId(), second.getPlayer().getRacePlayerId());
        assertEquals(first.getSnapshot().getPlayerStatus(), second.getSnapshot().getPlayerStatus());
        assertEquals(first.getSnapshot().getRaceStatus(), second.getSnapshot().getRaceStatus());
        assertEquals(first.getSnapshot().getPosition(), second.getSnapshot().getPosition());
        assertEquals(first.getSnapshot().getScore(), second.getSnapshot().getScore());
        assertEquals(racePlayer.getStatus(), second.getSnapshot().getPlayerStatus());
        verify(sessionLockService, times(2)).lock(
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID)
        );
    }

    private void verifyNoMutationSave() {
        verify(racePlayerRepository, never()).save(any());
        verify(raceFinishService, never()).finishRaceIfNeeded(any());
    }

    private RacePlayer createRacePlayer(
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus
    ) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setTitle("Runtime hardening");
        race.setRoomCode("ABC123");
        race.setStatus(raceStatus);
        race.setTotalDistance(1000);
        race.setStartedAt(LocalDateTime.of(2026, 8, 23, 11, 55));

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setDisplayName("Noa");
        racePlayer.setLaneNumber(2);
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
