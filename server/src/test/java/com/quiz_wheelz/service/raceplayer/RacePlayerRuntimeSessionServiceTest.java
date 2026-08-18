package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerHeartbeatResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerLeaveResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerReconnectResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerReconnectOutcome;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerRuntimeSessionServiceTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-07-06T10:20:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("UTC");
    private static final long RACE_ID = 1L;
    private static final long RACE_PLAYER_ID = 12L;

    @Mock
    private CurrentRacePlayerService currentRacePlayerService;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private RedisPresenceService redisPresenceService;

    @Mock
    private HttpServletRequest request;

    private RacePlayerRuntimeSessionService runtimeSessionService;

    @BeforeEach
    void setUp() {
        runtimeSessionService = new RacePlayerRuntimeSessionService(
                currentRacePlayerService,
                racePlayerRepository,
                redisPresenceService,
                new RacePlayerReconnectPolicy(),
                Clock.fixed(FIXED_INSTANT, FIXED_ZONE)
        );
    }

    @Test
    void heartbeatWithinGraceShouldNotLockOrSaveDb() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(now().minusMinutes(1)));

        RacePlayerHeartbeatResponse response =
                runtimeSessionService.heartbeat(request);

        assertEquals(RACE_ID, response.getRaceId());
        assertEquals(RACE_PLAYER_ID, response.getRacePlayerId());
        assertEquals(now(), response.getHeartbeatAt());

        verify(currentRacePlayerService).resolveCurrentRacePlayerIdentity(request);
        verify(currentRacePlayerService, never()).resolveCurrentRacePlayerSession(request);
        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, now());
        verify(racePlayerRepository, never()).findByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        verify(racePlayerRepository, never()).findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void heartbeatAfterExpiredGraceShouldMarkDisconnectedAndThrow() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        RacePlayer racePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(10)
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(now().minusMinutes(6)));
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> runtimeSessionService.heartbeat(request)
        );

        assertEquals(ErrorCode.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED, exception.getErrorCode());
        assertEquals(RacePlayerStatus.DISCONNECTED, racePlayer.getStatus());
        assertEquals(now(), racePlayer.getLastSeenAt());

        verify(redisPresenceService, never()).markOnline(RACE_ID, RACE_PLAYER_ID, now());
        verify(redisPresenceService, times(1)).findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID);
        verify(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);
        verify(racePlayerRepository).findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        verify(racePlayerRepository).save(racePlayer);
    }

    @Test
    void heartbeatAfterExpiredGraceShouldNotDisconnectWaitingPlayer() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        RacePlayer racePlayer = createRacePlayer(
                RaceStatus.WAITING_FOR_PLAYERS,
                RacePlayerStatus.WAITING,
                null
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(now().minusMinutes(4)));

        RacePlayerHeartbeatResponse response =
                runtimeSessionService.heartbeat(request);

        assertEquals(now(), response.getHeartbeatAt());
        assertEquals(RacePlayerStatus.WAITING, racePlayer.getStatus());

        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, now());
        verify(redisPresenceService, times(1)).findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID);
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void heartbeatWithOldWaitingHeartbeatShouldStayOnlineWhenRaceStartedWithinGrace() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        RacePlayer racePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(1)
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(now().minusMinutes(10)));
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        RacePlayerHeartbeatResponse response =
                runtimeSessionService.heartbeat(request);

        assertEquals(now(), response.getHeartbeatAt());
        assertEquals(RacePlayerStatus.RACING, racePlayer.getStatus());

        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, now());
        verify(redisPresenceService, times(1)).findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID);
        verify(racePlayerRepository).findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void heartbeatWithMissingLastHeartbeatShouldBeForgivingAndMarkOnline() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        RacePlayer racePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(1)
        );
        racePlayer.setLastSeenAt(now().minusMinutes(1));
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.empty());
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        RacePlayerHeartbeatResponse response =
                runtimeSessionService.heartbeat(request);

        assertEquals(now(), response.getHeartbeatAt());

        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, now());
        verify(racePlayerRepository).findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void reconnectWaitingPlayerShouldMarkOnlineAndReturnWaitingForRace() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.WAITING_FOR_PLAYERS,
                RacePlayerStatus.WAITING,
                null
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.WAITING_FOR_PLAYERS,
                RacePlayerStatus.WAITING,
                null
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));

        RacePlayerReconnectResponse response = runtimeSessionService.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.WAITING_FOR_RACE,
                true,
                false,
                RacePlayerStatus.WAITING,
                RaceStatus.WAITING_FOR_PLAYERS
        );

        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, now());
        verify(redisPresenceService, never()).findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID);
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void reconnectReadyRaceShouldNotReadLastHeartbeatAndReturnWaitingForRace() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.READY,
                RacePlayerStatus.WAITING,
                null
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.READY,
                RacePlayerStatus.WAITING,
                null
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));

        RacePlayerReconnectResponse response =
                runtimeSessionService.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.WAITING_FOR_RACE,
                true,
                false,
                RacePlayerStatus.WAITING,
                RaceStatus.READY
        );

        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, now());
        verify(redisPresenceService, never()).findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID);
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void reconnectRacingPlayerWithinGraceShouldReturnReconnectedAndCanContinue() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(1)
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(1)
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(now().minusMinutes(1)));

        RacePlayerReconnectResponse response = runtimeSessionService.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.RECONNECTED,
                true,
                true,
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );

        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, now());
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void reconnectRacingPlayerAfterGraceShouldMarkDisconnectedAndReturnExpired() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(10)
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(10)
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(now().minusMinutes(6)));

        RacePlayerReconnectResponse response = runtimeSessionService.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.RECONNECT_WINDOW_EXPIRED,
                false,
                false,
                RacePlayerStatus.DISCONNECTED,
                RaceStatus.IN_PROGRESS
        );
        assertEquals(now(), lockedRacePlayer.getLastSeenAt());

        verify(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);
        verify(racePlayerRepository).save(lockedRacePlayer);
    }

    @Test
    void reconnectDisconnectedPlayerShouldReturnAlreadyDisconnectedAndOnlineFalse() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.DISCONNECTED,
                now().minusMinutes(10)
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.DISCONNECTED,
                now().minusMinutes(10)
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));

        RacePlayerReconnectResponse response = runtimeSessionService.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.ALREADY_DISCONNECTED,
                false,
                false,
                RacePlayerStatus.DISCONNECTED,
                RaceStatus.IN_PROGRESS
        );

        verify(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);
        verify(redisPresenceService, never()).markOnline(RACE_ID, RACE_PLAYER_ID, now());
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void reconnectFinishedPlayerShouldReturnPlayerFinishedAndOnlineFalse() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.FINISHED,
                now().minusMinutes(10)
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.FINISHED,
                now().minusMinutes(10)
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));

        RacePlayerReconnectResponse response = runtimeSessionService.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.PLAYER_FINISHED,
                false,
                false,
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS
        );

        verify(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);
        verify(redisPresenceService, never()).markOnline(RACE_ID, RACE_PLAYER_ID, now());
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void reconnectFinishedRaceShouldReturnRaceFinishedAndOnlineFalse() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.FINISHED,
                RacePlayerStatus.RACING,
                now().minusMinutes(10)
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.FINISHED,
                RacePlayerStatus.RACING,
                now().minusMinutes(10)
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));

        RacePlayerReconnectResponse response = runtimeSessionService.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.RACE_FINISHED,
                false,
                false,
                RacePlayerStatus.RACING,
                RaceStatus.FINISHED
        );

        verify(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);
        verify(redisPresenceService, never()).markOnline(RACE_ID, RACE_PLAYER_ID, now());
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void leaveShouldMarkNonFinishedPlayerDisconnectedAndPersist() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(1)
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(1)
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));

        RacePlayerLeaveResponse response = runtimeSessionService.leave(request);

        assertEquals(RACE_PLAYER_ID, response.getRacePlayerId());
        assertEquals(now(), response.getLeftAt());
        assertEquals(RacePlayerStatus.DISCONNECTED, response.getPlayerStatus());
        assertEquals(RacePlayerStatus.DISCONNECTED, lockedRacePlayer.getStatus());
        assertEquals(now(), lockedRacePlayer.getLastSeenAt());

        verify(currentRacePlayerService).resolveCurrentRacePlayerSession(request);
        verify(racePlayerRepository).findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        verify(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);
        verify(racePlayerRepository).save(lockedRacePlayer);
    }

    @Test
    void leaveShouldNotChangeFinishedPlayerToDisconnected() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.FINISHED,
                now().minusMinutes(1)
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.FINISHED,
                now().minusMinutes(1)
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));

        RacePlayerLeaveResponse response = runtimeSessionService.leave(request);

        assertEquals(RACE_PLAYER_ID, response.getRacePlayerId());
        assertEquals(now(), response.getLeftAt());
        assertEquals(RacePlayerStatus.FINISHED, response.getPlayerStatus());
        assertEquals(RacePlayerStatus.FINISHED, lockedRacePlayer.getStatus());

        verify(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);
        verify(racePlayerRepository, never()).save(lockedRacePlayer);
    }

    @Test
    void heartbeatWithOpenGateShouldPerformFocusedDurableCheckpoint() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(now().minusMinutes(1)));
        when(redisPresenceService.tryAcquireLastSeenDbSyncGate(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(true);

        runtimeSessionService.heartbeat(request);

        verify(racePlayerRepository).updateLastSeenAtIfOlder(
                RACE_PLAYER_ID,
                RACE_ID,
                now()
        );
    }

    @Test
    void heartbeatWithClosedGateShouldSkipCheckpointDbAccess() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(now().minusMinutes(1)));
        when(redisPresenceService.tryAcquireLastSeenDbSyncGate(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(false);

        runtimeSessionService.heartbeat(request);

        verify(racePlayerRepository, never()).updateLastSeenAtIfOlder(any(), any(), any());
        verify(racePlayerRepository, never()).findLockedByIdAndRaceId(any(), any());
    }

    @Test
    void failedDbCheckpointShouldReleaseGateAndPropagateDatabaseFailure() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(now().minusMinutes(1)));
        when(redisPresenceService.tryAcquireLastSeenDbSyncGate(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(true);
        when(racePlayerRepository.updateLastSeenAtIfOlder(RACE_PLAYER_ID, RACE_ID, now()))
                .thenThrow(new DataIntegrityViolationException("db failed"));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> runtimeSessionService.heartbeat(request)
        );

        verify(redisPresenceService).releaseLastSeenDbSyncGate(RACE_ID, RACE_PLAYER_ID);
    }

    @Test
    void redisReadFailureDuringHeartbeatShouldUseDbAndPersistDirectly() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        RacePlayer racePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(2)
        );
        racePlayer.setLastSeenAt(now().minusMinutes(1));
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenThrow(new RedisConnectionFailureException("down"));
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        runtimeSessionService.heartbeat(request);

        verify(redisPresenceService, never()).markOnline(any(), any(), any());
        verify(racePlayerRepository).updateLastSeenAtIfOlder(RACE_PLAYER_ID, RACE_ID, now());
    }

    @Test
    void redisWriteFailureDuringHeartbeatShouldPersistDirectly() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(now().minusMinutes(1)));
        org.mockito.Mockito.doThrow(new RedisConnectionFailureException("down"))
                .when(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, now());

        runtimeSessionService.heartbeat(request);

        verify(racePlayerRepository).updateLastSeenAtIfOlder(RACE_PLAYER_ID, RACE_ID, now());
    }

    @Test
    void redisFailureDuringReconnectShouldUseDurableStateAndRefreshLastSeen() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(10)
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(10)
        );
        lockedRacePlayer.setLastSeenAt(now().minusMinutes(1));
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenThrow(new RedisConnectionFailureException("down"));
        org.mockito.Mockito.doThrow(new RedisConnectionFailureException("down"))
                .when(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, now());

        RacePlayerReconnectResponse response = runtimeSessionService.reconnect(request);

        assertEquals(RacePlayerReconnectOutcome.RECONNECTED, response.getOutcome());
        assertEquals(now(), lockedRacePlayer.getLastSeenAt());
    }

    @Test
    void redisCleanupFailureShouldNotUndoDurableLeave() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(1)
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(1)
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));
        org.mockito.Mockito.doThrow(new RedisConnectionFailureException("down"))
                .when(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);

        RacePlayerLeaveResponse response = runtimeSessionService.leave(request);

        assertEquals(RacePlayerStatus.DISCONNECTED, response.getPlayerStatus());
        verify(racePlayerRepository).save(lockedRacePlayer);
    }

    @Test
    void laterHeartbeatShouldResumeNormalRedisPathAfterOutage() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        RacePlayer racePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(1)
        );
        racePlayer.setLastSeenAt(now().minusMinutes(1));
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenThrow(new RedisConnectionFailureException("down"))
                .thenReturn(Optional.of(now().minusSeconds(1)));
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        runtimeSessionService.heartbeat(request);
        runtimeSessionService.heartbeat(request);

        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, now());
        verify(redisPresenceService).tryAcquireLastSeenDbSyncGate(RACE_ID, RACE_PLAYER_ID);
    }

    @Test
    void recoveredRedisWithMissingHeartbeatShouldRehydrateThenUseRedisFirst() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        RacePlayer racePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(2)
        );
        racePlayer.setLastSeenAt(now().minusMinutes(1));
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenThrow(new RedisConnectionFailureException("down"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(now().minusSeconds(1)));
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        runtimeSessionService.heartbeat(request);
        runtimeSessionService.heartbeat(request);
        runtimeSessionService.heartbeat(request);

        verify(racePlayerRepository, times(2))
                .findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        verify(racePlayerRepository, times(1))
                .updateLastSeenAtIfOlder(RACE_PLAYER_ID, RACE_ID, now());
        verify(redisPresenceService, times(2))
                .markOnline(RACE_ID, RACE_PLAYER_ID, now());
        verify(redisPresenceService, times(2))
                .tryAcquireLastSeenDbSyncGate(RACE_ID, RACE_PLAYER_ID);
    }

    @Test
    void reconnectWithRecoveredRedisAndMissingHeartbeatShouldRehydrateRedis() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(10)
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(10)
        );
        lockedRacePlayer.setLastSeenAt(now().minusMinutes(1));
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.empty());

        RacePlayerReconnectResponse response = runtimeSessionService.reconnect(request);

        assertEquals(RacePlayerReconnectOutcome.RECONNECTED, response.getOutcome());
        assertEquals(now(), lockedRacePlayer.getLastSeenAt());
        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, now());
    }

    @Test
    void expiredReconnectWithRecoveredRedisAndMissingHeartbeatShouldStayOffline() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(10)
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(10)
        );
        lockedRacePlayer.setLastSeenAt(now().minusMinutes(5).minusSeconds(31));
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));
        when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.empty());

        RacePlayerReconnectResponse response = runtimeSessionService.reconnect(request);

        assertEquals(RacePlayerReconnectOutcome.RECONNECT_WINDOW_EXPIRED, response.getOutcome());
        verify(redisPresenceService, never()).markOnline(any(), any(), any());
        verify(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);
    }

    private void assertReconnectResponse(
            RacePlayerReconnectResponse response,
            RacePlayerReconnectOutcome outcome,
            boolean online,
            boolean canContinueRace,
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus
    ) {
        assertEquals(RACE_ID, response.getRaceId());
        assertEquals(RACE_PLAYER_ID, response.getRacePlayerId());
        assertEquals(outcome, response.getOutcome());
        assertEquals(online, response.isOnline());
        assertEquals(canContinueRace, response.isCanContinueRace());
        assertEquals(playerStatus, response.getPlayerStatus());
        assertEquals(raceStatus, response.getRaceStatus());
        assertEquals(now(), response.getResolvedAt());
    }

    private RacePlayer createRacePlayer(
            RaceStatus raceStatus,
            RacePlayerStatus playerStatus,
            LocalDateTime raceStartedAt
    ) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(raceStatus);
        race.setStartedAt(raceStartedAt);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(playerStatus);

        return racePlayer;
    }

    private LocalDateTime now() {
        return LocalDateTime.ofInstant(FIXED_INSTANT, FIXED_ZONE);
    }
}
