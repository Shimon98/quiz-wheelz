package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerHeartbeatResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerLeaveResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
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
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.never;
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
                Clock.fixed(FIXED_INSTANT, FIXED_ZONE)
        );
    }

    @Test
    void heartbeatShouldResolveIdentityOnlyAndMarkOnline() {
        RacePlayerSessionIdentity identity =
                new RacePlayerSessionIdentity(RACE_ID, RACE_PLAYER_ID);
        when(currentRacePlayerService.resolveCurrentRacePlayerIdentity(request))
                .thenReturn(identity);

        RacePlayerHeartbeatResponse response =
                runtimeSessionService.heartbeat(request);

        assertEquals(RACE_ID, response.getRaceId());
        assertEquals(RACE_PLAYER_ID, response.getRacePlayerId());
        assertEquals(now(), response.getHeartbeatAt());

        verify(currentRacePlayerService).resolveCurrentRacePlayerIdentity(request);
        verify(currentRacePlayerService, never()).resolveCurrentRacePlayerSession(request);
        verify(redisPresenceService).markOnline(RACE_ID, RACE_PLAYER_ID);
        verify(racePlayerRepository, never()).findByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        verify(racePlayerRepository, never()).findLockedByIdAndRaceId(RACE_PLAYER_ID, RACE_ID);
        verify(racePlayerRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void leaveShouldMarkNonFinishedPlayerDisconnectedAndPersist() {
        RacePlayer sessionRacePlayer = createRacePlayer(RacePlayerStatus.RACING);
        RacePlayer lockedRacePlayer = createRacePlayer(RacePlayerStatus.RACING);
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
        RacePlayer sessionRacePlayer = createRacePlayer(RacePlayerStatus.FINISHED);
        RacePlayer lockedRacePlayer = createRacePlayer(RacePlayerStatus.FINISHED);
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

    private RacePlayer createRacePlayer(RacePlayerStatus status) {
        Race race = new Race();
        race.setId(RACE_ID);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(status);

        return racePlayer;
    }

    private LocalDateTime now() {
        return LocalDateTime.ofInstant(FIXED_INSTANT, FIXED_ZONE);
    }
}
