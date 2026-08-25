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
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationGate;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.InOrder;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.redis.RedisConnectionFailureException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerHeartbeatServiceTest {

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
    private RacePlayerGameplayTimelineService gameplayTimelineService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private RaceLiveMutationGate liveMutationGate;

    private RacePlayerHeartbeatService service;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(FIXED_INSTANT, FIXED_ZONE);
        RacePlayerReconnectPolicy reconnectPolicy = new RacePlayerReconnectPolicy();
        lenient().when(redisPresenceService.isOnline(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(true);
        lenient().when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.empty());
        lenient().when(redisPresenceService.renewExistingPresenceLease(
                        RACE_ID,
                        RACE_PLAYER_ID,
                        FIXED_INSTANT
                ))
                .thenReturn(true);
        RacePlayerGameplayPresenceService presenceService =
                new RacePlayerGameplayPresenceService(
                        redisPresenceService,
                        racePlayerRepository,
                        reconnectPolicy,
                        fixedClock
                );
        RacePlayerSessionLockService lockService = new RacePlayerSessionLockService(
                currentRacePlayerService,
                racePlayerRepository
        );
        RacePlayerDisconnectService disconnectService = new RacePlayerDisconnectService(
                racePlayerRepository,
                presenceService,
                gameplayTimelineService
        );
        service = new RacePlayerHeartbeatService(
                lockService,
                racePlayerRepository,
                redisPresenceService,
                reconnectPolicy,
                presenceService,
                gameplayTimelineService,
                disconnectService,
                mock(com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.class),
                liveMutationGate,
                fixedClock
        );
    }

    @Test
    void heartbeatWithinGraceShouldNotLockOrSaveDb() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(instantOf(now().minusMinutes(1))));

        RacePlayerHeartbeatResponse response =
                service.heartbeat(request);

        assertEquals(RACE_ID, response.getRaceId());
        assertEquals(RACE_PLAYER_ID, response.getRacePlayerId());
        assertEquals(now(), response.getHeartbeatAt());

        verify(currentRacePlayerService).resolveCurrentRacePlayerIdentity(request);
        verify(currentRacePlayerService, never()).resolveCurrentRacePlayerSession(request);
        verify(redisPresenceService).renewExistingPresenceLease(
                RACE_ID,
                RACE_PLAYER_ID,
                FIXED_INSTANT
        );
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
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(instantOf(now().minusMinutes(6))));
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));
        when(liveMutationGate.lockIfActive(racePlayer))
                .thenReturn(Optional.of(racePlayer.getRace()));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.heartbeat(request)
        );

        assertEquals(ErrorCode.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED, exception.getErrorCode());
        assertEquals(RacePlayerStatus.DISCONNECTED, racePlayer.getStatus());
        assertNull(racePlayer.getLastSeenAt());

        verify(redisPresenceService, never()).renewPresenceLease(RACE_ID, RACE_PLAYER_ID, FIXED_INSTANT);
        verify(redisPresenceService, times(2)).findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID);
        verify(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);
        InOrder mutationOrder = inOrder(racePlayerRepository, liveMutationGate);
        mutationOrder.verify(racePlayerRepository)
                .findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        mutationOrder.verify(liveMutationGate).lockIfActive(racePlayer);
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
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(instantOf(now().minusMinutes(4))));

        RacePlayerHeartbeatResponse response =
                service.heartbeat(request);

        assertEquals(now(), response.getHeartbeatAt());
        assertEquals(RacePlayerStatus.WAITING, racePlayer.getStatus());

        verify(redisPresenceService).renewExistingPresenceLease(
                RACE_ID,
                RACE_PLAYER_ID,
                FIXED_INSTANT
        );
        verify(redisPresenceService, times(1)).findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID);
        verify(racePlayerRepository, never()).save(any());
    }


    @Test
    void heartbeatWithOldWaitingActivityShouldStayOnlineWhenRaceStartedWithinGrace() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        RacePlayer racePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(1)
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(instantOf(now().minusMinutes(10))));
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        RacePlayerHeartbeatResponse response =
                service.heartbeat(request);

        assertEquals(now(), response.getHeartbeatAt());
        assertEquals(RacePlayerStatus.RACING, racePlayer.getStatus());

        verify(redisPresenceService).renewPresenceLease(RACE_ID, RACE_PLAYER_ID, FIXED_INSTANT);
        verify(redisPresenceService, times(2)).findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID);
        verify(racePlayerRepository).findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        verify(racePlayerRepository, never()).save(any());
    }


    @Test
    void heartbeatWithMissingGameplayActivityShouldRenewPresenceLease() {
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
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.empty());
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        RacePlayerHeartbeatResponse response =
                service.heartbeat(request);

        assertEquals(now(), response.getHeartbeatAt());

        verify(redisPresenceService).renewPresenceLease(RACE_ID, RACE_PLAYER_ID, FIXED_INSTANT);
        verify(racePlayerRepository).findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        verify(racePlayerRepository, never()).save(any());
    }


    @Test
    void heartbeatWithOpenGateShouldPerformFocusedDurableCheckpoint() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(instantOf(now().minusMinutes(1))));
        when(redisPresenceService.tryAcquireLastSeenDbSyncGate(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(true);

        service.heartbeat(request);

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
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(instantOf(now().minusMinutes(1))));
        when(redisPresenceService.tryAcquireLastSeenDbSyncGate(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(false);

        service.heartbeat(request);

        verify(racePlayerRepository, never()).updateLastSeenAtIfOlder(any(), any(), any());
        verify(racePlayerRepository, never()).findLockedByIdAndRaceId(any(), any());
    }


    @Test
    void failedDbCheckpointShouldReleaseGateAndPropagateDatabaseFailure() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(instantOf(now().minusMinutes(1))));
        when(redisPresenceService.tryAcquireLastSeenDbSyncGate(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(true);
        when(racePlayerRepository.updateLastSeenAtIfOlder(RACE_PLAYER_ID, RACE_ID, now()))
                .thenThrow(new DataIntegrityViolationException("db failed"));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> service.heartbeat(request)
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
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenThrow(new RedisConnectionFailureException("down"));
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        service.heartbeat(request);

        verify(redisPresenceService, never()).renewPresenceLease(any(), any(), any());
        verify(racePlayerRepository).updateLastSeenAtIfOlder(RACE_PLAYER_ID, RACE_ID, now());
    }


    @Test
    void redisWriteFailureDuringHeartbeatShouldPersistDirectly() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(instantOf(now().minusMinutes(1))));
        when(redisPresenceService.renewExistingPresenceLease(
                RACE_ID,
                RACE_PLAYER_ID,
                FIXED_INSTANT
        )).thenReturn(false);
        RacePlayer racePlayer = createRacePlayer(
                RaceStatus.IN_PROGRESS,
                RacePlayerStatus.RACING,
                now().minusMinutes(1)
        );
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));
        org.mockito.Mockito.doThrow(new RedisConnectionFailureException("down"))
                .when(redisPresenceService).renewPresenceLease(
                        RACE_ID,
                        RACE_PLAYER_ID,
                        FIXED_INSTANT
                );

        service.heartbeat(request);

        assertEquals(now(), racePlayer.getLastSeenAt());
        verify(racePlayerRepository).save(racePlayer);
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
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenThrow(new RedisConnectionFailureException("down"))
                .thenReturn(Optional.of(instantOf(now().minusSeconds(1))));
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        service.heartbeat(request);
        service.heartbeat(request);

        verify(redisPresenceService).renewExistingPresenceLease(
                RACE_ID,
                RACE_PLAYER_ID,
                FIXED_INSTANT
        );
        verify(redisPresenceService).tryAcquireLastSeenDbSyncGate(RACE_ID, RACE_PLAYER_ID);
    }


    @Test
    void recoveredRedisWithMissingActivityShouldRehydrateThenUseRedisFirst() {
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
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenThrow(new RedisConnectionFailureException("down"))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(instantOf(now().minusSeconds(1))));
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        service.heartbeat(request);
        service.heartbeat(request);
        service.heartbeat(request);

        verify(racePlayerRepository, times(2))
                .findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        verify(racePlayerRepository, times(1))
                .updateLastSeenAtIfOlder(RACE_PLAYER_ID, RACE_ID, now());
        verify(redisPresenceService, times(1))
                .renewPresenceLease(RACE_ID, RACE_PLAYER_ID, FIXED_INSTANT);
        verify(redisPresenceService, times(1))
                .renewExistingPresenceLease(RACE_ID, RACE_PLAYER_ID, FIXED_INSTANT);
        verify(redisPresenceService, times(2))
                .tryAcquireLastSeenDbSyncGate(RACE_ID, RACE_PLAYER_ID);
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

    private Instant instantOf(LocalDateTime localDateTime) {
        return localDateTime.atZone(FIXED_ZONE).toInstant();
    }
}
