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
class RacePlayerLeaveServiceTest {

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

    private RacePlayerLeaveService service;

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
        service = new RacePlayerLeaveService(
                lockService,
                disconnectService,
                fixedClock
        );
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

        RacePlayerLeaveResponse response = service.leave(request);

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

        RacePlayerLeaveResponse response = service.leave(request);

        assertEquals(RACE_PLAYER_ID, response.getRacePlayerId());
        assertEquals(now(), response.getLeftAt());
        assertEquals(RacePlayerStatus.FINISHED, response.getPlayerStatus());
        assertEquals(RacePlayerStatus.FINISHED, lockedRacePlayer.getStatus());

        verify(redisPresenceService).markOffline(RACE_ID, RACE_PLAYER_ID);
        verify(racePlayerRepository, never()).save(lockedRacePlayer);
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

        RacePlayerLeaveResponse response = service.leave(request);

        assertEquals(RacePlayerStatus.DISCONNECTED, response.getPlayerStatus());
        verify(racePlayerRepository).save(lockedRacePlayer);
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

