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
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerReconnectServiceTest {

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

    private RacePlayerReconnectService service;

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(FIXED_INSTANT, FIXED_ZONE);
        RacePlayerReconnectPolicy reconnectPolicy = new RacePlayerReconnectPolicy();
        lenient().when(redisPresenceService.isOnline(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(true);
        lenient().when(redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.empty());
        RacePlayerGameplayPresenceService presenceService =
                new RacePlayerGameplayPresenceService(
                        redisPresenceService,
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
        service = new RacePlayerReconnectService(
                lockService,
                presenceService,
                gameplayTimelineService,
                disconnectService,
                fixedClock
        );
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

        RacePlayerReconnectResponse response = service.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.WAITING_FOR_RACE,
                true,
                false,
                RacePlayerStatus.WAITING,
                RaceStatus.WAITING_FOR_PLAYERS
        );

        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, FIXED_INSTANT);
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
                service.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.WAITING_FOR_RACE,
                true,
                false,
                RacePlayerStatus.WAITING,
                RaceStatus.READY
        );

        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, FIXED_INSTANT);
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
                .thenReturn(Optional.of(instantOf(now().minusMinutes(1))));

        RacePlayerReconnectResponse response = service.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.RECONNECTED,
                true,
                true,
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS
        );

        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, FIXED_INSTANT);
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
                .thenReturn(Optional.of(instantOf(now().minusMinutes(6))));

        RacePlayerReconnectResponse response = service.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.RECONNECT_WINDOW_EXPIRED,
                false,
                false,
                RacePlayerStatus.DISCONNECTED,
                RaceStatus.IN_PROGRESS
        );
        assertNull(lockedRacePlayer.getLastSeenAt());

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

        RacePlayerReconnectResponse response = service.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.ALREADY_DISCONNECTED,
                false,
                false,
                RacePlayerStatus.DISCONNECTED,
                RaceStatus.IN_PROGRESS
        );

        verify(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);
        verify(redisPresenceService, never()).markOnline(RACE_ID, RACE_PLAYER_ID, FIXED_INSTANT);
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

        RacePlayerReconnectResponse response = service.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.PLAYER_FINISHED,
                false,
                false,
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS
        );

        verify(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);
        verify(redisPresenceService, never()).markOnline(RACE_ID, RACE_PLAYER_ID, FIXED_INSTANT);
        verify(racePlayerRepository, never()).save(any());
    }


    @Test
    void reconnectFinalizedRaceShouldReturnRaceFinishedWithNormalizedStatus() {
        RacePlayer sessionRacePlayer = createRacePlayer(
                RaceStatus.FINISHED,
                RacePlayerStatus.DISCONNECTED,
                now().minusMinutes(10)
        );
        RacePlayer lockedRacePlayer = createRacePlayer(
                RaceStatus.FINISHED,
                RacePlayerStatus.DISCONNECTED,
                now().minusMinutes(10)
        );
        when(currentRacePlayerService.resolveCurrentRacePlayerSession(request))
                .thenReturn(sessionRacePlayer);
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(lockedRacePlayer));

        RacePlayerReconnectResponse response = service.reconnect(request);

        assertReconnectResponse(
                response,
                RacePlayerReconnectOutcome.RACE_FINISHED,
                false,
                false,
                RacePlayerStatus.DISCONNECTED,
                RaceStatus.FINISHED
        );

        verify(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);
        verify(redisPresenceService, never()).markOnline(RACE_ID, RACE_PLAYER_ID, FIXED_INSTANT);
        verify(racePlayerRepository, never()).save(any());
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
                .when(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, FIXED_INSTANT);

        RacePlayerReconnectResponse response = service.reconnect(request);

        assertEquals(RacePlayerReconnectOutcome.RECONNECTED, response.getOutcome());
        assertEquals(now(), lockedRacePlayer.getLastSeenAt());
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

        RacePlayerReconnectResponse response = service.reconnect(request);

        assertEquals(RacePlayerReconnectOutcome.RECONNECTED, response.getOutcome());
        assertEquals(now(), lockedRacePlayer.getLastSeenAt());
        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID, FIXED_INSTANT);
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

        RacePlayerReconnectResponse response = service.reconnect(request);

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

    private Instant instantOf(LocalDateTime localDateTime) {
        return localDateTime.atZone(FIXED_ZONE).toInstant();
    }
}

