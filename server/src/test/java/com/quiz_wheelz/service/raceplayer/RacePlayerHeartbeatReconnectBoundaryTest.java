package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
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

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerHeartbeatReconnectBoundaryTest {

    private static final Instant NOW = Instant.parse("2026-07-06T10:20:00Z");
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

    private RacePlayerHeartbeatService heartbeatService;
    private RacePlayer racePlayer;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
        RacePlayerReconnectPolicy reconnectPolicy = new RacePlayerReconnectPolicy();
        RacePlayerGameplayPresenceService presenceService =
                new RacePlayerGameplayPresenceService(
                        redisPresenceService,
                        racePlayerRepository,
                        reconnectPolicy,
                        clock
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
        heartbeatService = new RacePlayerHeartbeatService(
                lockService,
                racePlayerRepository,
                redisPresenceService,
                reconnectPolicy,
                presenceService,
                gameplayTimelineService,
                disconnectService,
                clock
        );

        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setStartedAt(LocalDateTime.ofInstant(NOW.minusSeconds(120), ZoneOffset.UTC));
        racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(RacePlayerStatus.RACING);
    }

    @Test
    void missingLeaseInsideGraceRequiresExplicitReconnectWithoutReanchor() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);
        when(redisPresenceService.isOnline(RACE_ID, RACE_PLAYER_ID)).thenReturn(false);
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(NOW.minusSeconds(60)));
        when(racePlayerRepository.findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID))
                .thenReturn(Optional.of(racePlayer));

        ApiException exception = assertThrows(
                ApiException.class,
                () -> heartbeatService.heartbeat(request)
        );

        assertEquals(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED, exception.getErrorCode());
        assertEquals(RacePlayerStatus.RACING, racePlayer.getStatus());
        verify(gameplayTimelineService).settleGameplayRequest(
                org.mockito.ArgumentMatchers.eq(racePlayer),
                org.mockito.ArgumentMatchers.eq(NOW),
                any()
        );
        verify(gameplayTimelineService, never()).settleReconnect(any(), any(), any());
        verify(redisPresenceService, never()).renewExistingPresenceLease(any(), any(), any());
        verify(redisPresenceService, never()).renewPresenceLease(any(), any(), any());
        verify(racePlayerRepository, never()).updateLastSeenAtIfOlder(any(), any(), any());
        verify(racePlayerRepository, never()).save(any());
    }
}
