package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerHeartbeatResponse;
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
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerDuplicateHeartbeatTest {

    private static final Instant NOW = Instant.parse("2026-08-23T12:00:00Z");
    private static final ZoneId ZONE = ZoneId.of("UTC");
    private static final long RACE_ID = 1L;
    private static final long RACE_PLAYER_ID = 7L;

    @Mock
    private RacePlayerSessionLockService sessionLockService;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private RedisPresenceService redisPresenceService;

    @Mock
    private RacePlayerGameplayPresenceService gameplayPresenceService;

    @Mock
    private RacePlayerGameplayTimelineService gameplayTimelineService;

    @Mock
    private RacePlayerDisconnectService disconnectService;

    @Mock
    private HttpServletRequest request;

    private RacePlayerHeartbeatService heartbeatService;
    private RacePlayerSessionIdentity identity;

    @BeforeEach
    void setUp() {
        identity = new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        heartbeatService = new RacePlayerHeartbeatService(
                sessionLockService,
                racePlayerRepository,
                redisPresenceService,
                new RacePlayerReconnectPolicy(),
                gameplayPresenceService,
                gameplayTimelineService,
                disconnectService,
                Clock.fixed(NOW, ZONE)
        );
        when(sessionLockService.resolveIdentity(request)).thenReturn(identity);
    }

    @Test
    void consecutiveValidHeartbeatsStayOnRepeatSafeRedisFastPath() {
        when(redisPresenceService.isOnline(RACE_ID, RACE_PLAYER_ID)).thenReturn(true);
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(NOW.minusSeconds(1)));
        when(redisPresenceService.renewExistingPresenceLease(
                RACE_ID,
                RACE_PLAYER_ID,
                NOW
        )).thenReturn(true);

        RacePlayerHeartbeatResponse first = heartbeatService.heartbeat(request);
        RacePlayerHeartbeatResponse second = heartbeatService.heartbeat(request);

        assertEquals(RACE_PLAYER_ID, first.getRacePlayerId());
        assertEquals(RACE_PLAYER_ID, second.getRacePlayerId());
        assertEquals(localNow(), first.getHeartbeatAt());
        assertEquals(localNow(), second.getHeartbeatAt());
        verify(redisPresenceService, times(2)).renewExistingPresenceLease(
                RACE_ID,
                RACE_PLAYER_ID,
                NOW
        );
        verify(sessionLockService, never()).lock(any(RacePlayerSessionIdentity.class));
        verifyNoInteractions(gameplayTimelineService, disconnectService);
        verify(racePlayerRepository, never()).save(any());
    }

    @Test
    void repeatedMissingPresenceHeartbeatRequiresReconnectWithoutRenewal() {
        RacePlayer racePlayer = racePlayer(RacePlayerStatus.RACING, RaceStatus.IN_PROGRESS);
        RacePlayerGameplayPresenceService.GameplayPresenceDecision absent =
                new RacePlayerGameplayPresenceService.GameplayPresenceDecision(
                        true,
                        false,
                        false,
                        NOW.minusSeconds(1).toEpochMilli()
                );
        when(redisPresenceService.isOnline(RACE_ID, RACE_PLAYER_ID)).thenReturn(false);
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(NOW.minusSeconds(1)));
        when(sessionLockService.lock(identity)).thenReturn(racePlayer);
        when(gameplayPresenceService.resolve(racePlayer, NOW)).thenReturn(absent);

        ApiException first = assertThrows(
                ApiException.class,
                () -> heartbeatService.heartbeat(request)
        );
        ApiException second = assertThrows(
                ApiException.class,
                () -> heartbeatService.heartbeat(request)
        );

        assertEquals(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED, first.getErrorCode());
        assertEquals(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED, second.getErrorCode());
        verify(gameplayTimelineService, times(2)).settleGameplayRequest(
                racePlayer,
                NOW,
                absent
        );
        verify(gameplayTimelineService, never()).settleReconnect(any(), any(), any());
        verify(gameplayPresenceService, never()).renewPresenceLease(any(), any());
        verify(redisPresenceService, never()).renewExistingPresenceLease(any(), any(), any());
        verifyNoInteractions(disconnectService);
    }

    @Test
    void disconnectedHeartbeatCannotRenewOrResurrectPlayer() {
        RacePlayer racePlayer = racePlayer(
                RacePlayerStatus.DISCONNECTED,
                RaceStatus.IN_PROGRESS
        );
        prepareTerminalHeartbeat(racePlayer);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> heartbeatService.heartbeat(request)
        );

        assertEquals(ErrorCode.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED, exception.getErrorCode());
        assertEquals(RacePlayerStatus.DISCONNECTED, racePlayer.getStatus());
        verify(gameplayPresenceService).markOffline(racePlayer);
        verifyNoPresenceRenewalOrSettlement();
    }

    @Test
    void finishedHeartbeatCannotRenewOrResurrectPlayer() {
        RacePlayer racePlayer = racePlayer(RacePlayerStatus.FINISHED, RaceStatus.IN_PROGRESS);
        prepareTerminalHeartbeat(racePlayer);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> heartbeatService.heartbeat(request)
        );

        assertEquals(ErrorCode.RACE_PLAYER_NOT_RACING, exception.getErrorCode());
        assertEquals(RacePlayerStatus.FINISHED, racePlayer.getStatus());
        verify(gameplayPresenceService).markOffline(racePlayer);
        verifyNoPresenceRenewalOrSettlement();
    }

    private void prepareTerminalHeartbeat(RacePlayer racePlayer) {
        when(redisPresenceService.isOnline(RACE_ID, RACE_PLAYER_ID)).thenReturn(false);
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID))
                .thenReturn(Optional.of(NOW.minusSeconds(1)));
        when(sessionLockService.lock(identity)).thenReturn(racePlayer);
    }

    private void verifyNoPresenceRenewalOrSettlement() {
        verify(redisPresenceService, never()).renewExistingPresenceLease(any(), any(), any());
        verify(gameplayPresenceService, never()).renewPresenceLease(any(), any());
        verifyNoInteractions(gameplayTimelineService, disconnectService);
    }

    private RacePlayer racePlayer(RacePlayerStatus playerStatus, RaceStatus raceStatus) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(raceStatus);
        race.setStartedAt(localNow().minusMinutes(1));

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(playerStatus);
        return racePlayer;
    }

    private LocalDateTime localNow() {
        return LocalDateTime.ofInstant(NOW, ZONE);
    }
}
