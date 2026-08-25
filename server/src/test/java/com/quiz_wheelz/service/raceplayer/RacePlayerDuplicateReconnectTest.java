package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerReconnectResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerReconnectOutcome;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerDuplicateReconnectTest {

    private static final Instant NOW = Instant.parse("2026-08-23T12:00:00Z");
    private static final long RACE_ID = 1L;
    private static final long RACE_PLAYER_ID = 7L;

    @Mock
    private RacePlayerSessionLockService sessionLockService;

    @Mock
    private RacePlayerGameplayPresenceService gameplayPresenceService;

    @Mock
    private RacePlayerDisconnectService disconnectService;

    @Mock
    private QuestionTimeoutService questionTimeoutService;

    @Mock
    private RaceMovementService raceMovementService;

    @Mock
    private HttpServletRequest request;

    private RacePlayerReconnectService reconnectService;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(NOW, ZoneId.of("UTC"));
        RacePlayerGameplayTimelineService timelineService =
                new RacePlayerGameplayTimelineService(
                        questionTimeoutService,
                        raceMovementService,
                        clock
                );
        reconnectService = new RacePlayerReconnectService(
                sessionLockService,
                gameplayPresenceService,
                timelineService,
                disconnectService,
                mock(com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.class),
                mock(com.quiz_wheelz.service.liveevent.RaceLiveMutationGate.class),
                clock
        );
    }

    @Test
    void firstAbsentReconnectReanchorsOnceAndImmediateOnlineReconnectDoesNot() {
        RacePlayer racePlayer = racePlayer(RacePlayerStatus.RACING, RaceStatus.IN_PROGRESS);
        long trustedCutoff = NOW.minusSeconds(45).toEpochMilli();
        RacePlayerGameplayPresenceService.GameplayPresenceDecision absent =
                new RacePlayerGameplayPresenceService.GameplayPresenceDecision(
                        true,
                        false,
                        false,
                        trustedCutoff
                );
        RacePlayerGameplayPresenceService.GameplayPresenceDecision online =
                new RacePlayerGameplayPresenceService.GameplayPresenceDecision(
                        true,
                        true,
                        false,
                        NOW.toEpochMilli()
                );
        when(sessionLockService.resolveAndLock(request)).thenReturn(racePlayer);
        when(gameplayPresenceService.resolve(racePlayer, NOW))
                .thenReturn(absent, online);

        RacePlayerReconnectResponse first = reconnectService.reconnect(request);
        RacePlayerReconnectResponse second = reconnectService.reconnect(request);

        assertReconnectCanContinue(first);
        assertReconnectCanContinue(second);
        assertEquals(RacePlayerStatus.RACING, racePlayer.getStatus());
        verify(questionTimeoutService).settleWithOverdueTimeout(
                racePlayer,
                java.time.LocalDateTime.ofInstant(NOW, ZoneId.of("UTC")),
                NOW.toEpochMilli(),
                trustedCutoff
        );
        verify(questionTimeoutService).settleWithOverdueTimeout(
                racePlayer,
                java.time.LocalDateTime.ofInstant(NOW, ZoneId.of("UTC")),
                NOW.toEpochMilli(),
                NOW.toEpochMilli()
        );
        verify(raceMovementService, times(1)).reanchorAt(
                racePlayer,
                NOW.toEpochMilli()
        );
        verify(gameplayPresenceService, times(2)).renewPresenceLease(racePlayer, NOW);
        verifyNoInteractions(disconnectService);
    }

    @Test
    void repeatedWaitingReconnectStaysWaitingForRace() {
        RacePlayer racePlayer = racePlayer(RacePlayerStatus.WAITING, RaceStatus.READY);
        when(sessionLockService.resolveAndLock(request)).thenReturn(racePlayer);

        RacePlayerReconnectResponse first = reconnectService.reconnect(request);
        RacePlayerReconnectResponse second = reconnectService.reconnect(request);

        assertRepeatedOutcome(
                first,
                second,
                RacePlayerReconnectOutcome.WAITING_FOR_RACE,
                true,
                RacePlayerStatus.WAITING
        );
        verify(gameplayPresenceService, times(2)).renewPresenceLease(racePlayer, NOW);
        verify(gameplayPresenceService, never()).resolve(any(), any());
        verifyNoInteractions(questionTimeoutService, raceMovementService, disconnectService);
    }

    @Test
    void repeatedFinishedReconnectStaysPlayerFinished() {
        assertRepeatedTerminalOutcome(
                RacePlayerStatus.FINISHED,
                RaceStatus.IN_PROGRESS,
                RacePlayerReconnectOutcome.PLAYER_FINISHED
        );
    }

    @Test
    void repeatedDisconnectedReconnectStaysAlreadyDisconnected() {
        assertRepeatedTerminalOutcome(
                RacePlayerStatus.DISCONNECTED,
                RaceStatus.IN_PROGRESS,
                RacePlayerReconnectOutcome.ALREADY_DISCONNECTED
        );
    }

    @Test
    void repeatedFinishedRaceReconnectStaysRaceFinished() {
        assertRepeatedTerminalOutcome(
                RacePlayerStatus.RACING,
                RaceStatus.FINISHED,
                RacePlayerReconnectOutcome.RACE_FINISHED
        );
    }

    private void assertRepeatedTerminalOutcome(
            RacePlayerStatus playerStatus,
            RaceStatus raceStatus,
            RacePlayerReconnectOutcome outcome
    ) {
        RacePlayer racePlayer = racePlayer(playerStatus, raceStatus);
        when(sessionLockService.resolveAndLock(request)).thenReturn(racePlayer);

        RacePlayerReconnectResponse first = reconnectService.reconnect(request);
        RacePlayerReconnectResponse second = reconnectService.reconnect(request);

        assertRepeatedOutcome(first, second, outcome, false, playerStatus);
        verify(gameplayPresenceService, times(2)).markOffline(racePlayer);
        verify(gameplayPresenceService, never()).resolve(any(), any());
        verify(gameplayPresenceService, never()).renewPresenceLease(any(), any());
        verifyNoInteractions(questionTimeoutService, raceMovementService, disconnectService);
    }

    private void assertReconnectCanContinue(RacePlayerReconnectResponse response) {
        assertEquals(RacePlayerReconnectOutcome.RECONNECTED, response.getOutcome());
        assertTrue(response.isOnline());
        assertTrue(response.isCanContinueRace());
    }

    private void assertRepeatedOutcome(
            RacePlayerReconnectResponse first,
            RacePlayerReconnectResponse second,
            RacePlayerReconnectOutcome outcome,
            boolean online,
            RacePlayerStatus playerStatus
    ) {
        assertEquals(outcome, first.getOutcome());
        assertEquals(outcome, second.getOutcome());
        assertEquals(online, first.isOnline());
        assertEquals(online, second.isOnline());
        assertFalse(first.isCanContinueRace());
        assertFalse(second.isCanContinueRace());
        assertEquals(playerStatus, first.getPlayerStatus());
        assertEquals(playerStatus, second.getPlayerStatus());
    }

    private RacePlayer racePlayer(RacePlayerStatus playerStatus, RaceStatus raceStatus) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(raceStatus);

        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(RACE_PLAYER_ID);
        racePlayer.setRace(race);
        racePlayer.setStatus(playerStatus);
        return racePlayer;
    }
}
