package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerLeaveResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
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
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerDuplicateLeaveTest {

    private static final Instant NOW = Instant.parse("2026-08-23T12:00:00Z");
    private static final long RACE_ID = 1L;
    private static final long RACE_PLAYER_ID = 7L;

    @Mock
    private RacePlayerSessionLockService sessionLockService;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private RacePlayerGameplayPresenceService gameplayPresenceService;

    @Mock
    private RacePlayerGameplayTimelineService gameplayTimelineService;

    @Mock
    private HttpServletRequest request;

    private RacePlayerLeaveService leaveService;

    @BeforeEach
    void setUp() {
        RacePlayerDisconnectService disconnectService = new RacePlayerDisconnectService(
                racePlayerRepository,
                gameplayPresenceService,
                gameplayTimelineService
        );
        leaveService = new RacePlayerLeaveService(
                sessionLockService,
                disconnectService,
                new com.quiz_wheelz.service.liveevent.RaceLiveMutationTracker(
                        mock(com.quiz_wheelz.service.liveevent.RaceLiveMutationGate.class),
                        mock(com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.class)
                ),
                Clock.fixed(NOW, ZoneId.of("UTC"))
        );
    }

    @Test
    void secondLeaveAfterDisconnectHasNoRepeatedGameplaySideEffects() {
        RacePlayer racePlayer = racePlayer(RacePlayerStatus.RACING);
        double originalPosition = racePlayer.getPosition();
        RacePlayerGameplayPresenceService.GameplayPresenceDecision presenceDecision =
                new RacePlayerGameplayPresenceService.GameplayPresenceDecision(
                        true,
                        true,
                        false,
                        NOW.toEpochMilli()
                );
        when(sessionLockService.resolveAndLock(request)).thenReturn(racePlayer);
        when(gameplayPresenceService.resolve(racePlayer, NOW))
                .thenReturn(presenceDecision);

        RacePlayerLeaveResponse first = leaveService.leave(request);
        RacePlayerLeaveResponse second = leaveService.leave(request);

        assertEquals(RacePlayerStatus.DISCONNECTED, first.getPlayerStatus());
        assertEquals(RacePlayerStatus.DISCONNECTED, second.getPlayerStatus());
        assertEquals(RacePlayerStatus.DISCONNECTED, racePlayer.getStatus());
        assertEquals(originalPosition, racePlayer.getPosition());
        verify(sessionLockService, times(2)).resolveAndLock(request);
        verify(gameplayPresenceService, times(1)).resolve(racePlayer, NOW);
        verify(gameplayTimelineService, times(1)).settleGameplayRequest(
                racePlayer,
                NOW,
                presenceDecision
        );
        verify(gameplayPresenceService, times(1)).recordGameplayActivity(racePlayer, NOW);
        verify(racePlayerRepository, times(1)).save(racePlayer);
        verify(gameplayPresenceService, times(2)).markOffline(racePlayer);
        verify(gameplayTimelineService, never()).settleReconnect(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any()
        );
    }

    @Test
    void repeatedFinishedLeaveKeepsFinishedAndOnlyMarksOffline() {
        RacePlayer racePlayer = racePlayer(RacePlayerStatus.FINISHED);
        when(sessionLockService.resolveAndLock(request)).thenReturn(racePlayer);

        RacePlayerLeaveResponse first = leaveService.leave(request);
        RacePlayerLeaveResponse second = leaveService.leave(request);

        assertEquals(RacePlayerStatus.FINISHED, first.getPlayerStatus());
        assertEquals(RacePlayerStatus.FINISHED, second.getPlayerStatus());
        assertEquals(RacePlayerStatus.FINISHED, racePlayer.getStatus());
        verify(gameplayPresenceService, times(2)).markOffline(racePlayer);
        verify(racePlayerRepository, never()).save(racePlayer);
        verifyNoInteractions(gameplayTimelineService);
        verify(gameplayPresenceService, never()).resolve(racePlayer, NOW);
        verify(gameplayPresenceService, never()).recordGameplayActivity(racePlayer, NOW);
    }

    private RacePlayer racePlayer(RacePlayerStatus status) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(RaceStatus.IN_PROGRESS);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(status);
        racePlayer.setPosition(120.0);
        return racePlayer;
    }
}
