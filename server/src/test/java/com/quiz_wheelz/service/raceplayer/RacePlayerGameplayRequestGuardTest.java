package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class RacePlayerGameplayRequestGuardTest {

    private static final Instant NOW = Instant.parse("2026-06-30T10:00:00Z");

    private RacePlayerGameplayPresenceService gameplayPresenceService;
    private RacePlayerGameplayTimelineService gameplayTimelineService;
    private RacePlayerRepository racePlayerRepository;
    private RacePlayerGameplayRequestGuard guard;
    private RacePlayer racePlayer;

    @BeforeEach
    void setUp() {
        gameplayPresenceService = mock(RacePlayerGameplayPresenceService.class);
        gameplayTimelineService = mock(RacePlayerGameplayTimelineService.class);
        racePlayerRepository = mock(RacePlayerRepository.class);
        guard = new RacePlayerGameplayRequestGuard(
                gameplayPresenceService,
                gameplayTimelineService,
                racePlayerRepository
        );
        Race race = new Race();
        race.setStatus(RaceStatus.IN_PROGRESS);
        racePlayer = new RacePlayer();
        racePlayer.setRace(race);
        racePlayer.setStatus(RacePlayerStatus.RACING);
    }

    @Test
    void finishedPlayerSkipsGameplayPresencePolicy() {
        racePlayer.setStatus(RacePlayerStatus.FINISHED);

        guard.requireGameplayAccess(racePlayer, NOW);

        verifyNoInteractions(
                gameplayPresenceService,
                gameplayTimelineService,
                racePlayerRepository
        );
    }

    @Test
    void disconnectedPlayerSkipsGameplayPresencePolicy() {
        racePlayer.setStatus(RacePlayerStatus.DISCONNECTED);

        guard.requireGameplayAccess(racePlayer, NOW);

        verifyNoInteractions(
                gameplayPresenceService,
                gameplayTimelineService,
                racePlayerRepository
        );
    }

    @Test
    void terminalRaceSkipsGameplayPresencePolicy() {
        racePlayer.getRace().setStatus(RaceStatus.FINISHED);

        guard.requireGameplayAccess(racePlayer, NOW);

        verifyNoInteractions(
                gameplayPresenceService,
                gameplayTimelineService,
                racePlayerRepository
        );
    }

    @Test
    void onlinePlayerSettlesRecordsActivityAndContinues() {
        RacePlayerGameplayPresenceService.GameplayPresenceDecision decision =
                decision(true, true, false);
        when(gameplayPresenceService.resolve(racePlayer, NOW)).thenReturn(decision);

        guard.requireGameplayAccess(racePlayer, NOW);

        verify(gameplayTimelineService).settleGameplayRequest(
                racePlayer,
                NOW,
                decision
        );
        verify(gameplayPresenceService).recordGameplayActivity(racePlayer, NOW);
    }

    @Test
    void absentPlayerInsideGraceSettlesWithoutActivityAndMustReconnect() {
        RacePlayerGameplayPresenceService.GameplayPresenceDecision decision =
                decision(true, false, false);
        when(gameplayPresenceService.resolve(racePlayer, NOW)).thenReturn(decision);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> guard.requireGameplayAccess(racePlayer, NOW)
        );

        assertEquals(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED, exception.getErrorCode());
        verify(gameplayTimelineService).settleGameplayRequest(
                racePlayer,
                NOW,
                decision
        );
        verify(gameplayPresenceService, never()).recordGameplayActivity(racePlayer, NOW);
    }

    @Test
    void finishedSettlementWinsOverReconnectRequiredDecision() {
        RacePlayerGameplayPresenceService.GameplayPresenceDecision decision =
                decision(true, false, false);
        when(gameplayPresenceService.resolve(racePlayer, NOW)).thenReturn(decision);
        when(gameplayTimelineService.settleGameplayRequest(
                racePlayer,
                NOW,
                decision
        )).thenAnswer(invocation -> {
            racePlayer.setStatus(RacePlayerStatus.FINISHED);
            return false;
        });

        guard.requireGameplayAccess(racePlayer, NOW);

        assertEquals(RacePlayerStatus.FINISHED, racePlayer.getStatus());
        verify(gameplayPresenceService).markOffline(racePlayer);
        verify(gameplayPresenceService, never()).recordGameplayActivity(racePlayer, NOW);
        verify(racePlayerRepository, never()).save(racePlayer);
    }

    @Test
    void finishedSettlementWinsOverExpiredPresenceDecision() {
        RacePlayerGameplayPresenceService.GameplayPresenceDecision decision =
                decision(true, false, true);
        when(gameplayPresenceService.resolve(racePlayer, NOW)).thenReturn(decision);
        when(gameplayTimelineService.settleGameplayRequest(
                racePlayer,
                NOW,
                decision
        )).thenAnswer(invocation -> {
            racePlayer.setStatus(RacePlayerStatus.FINISHED);
            return false;
        });

        guard.requireGameplayAccess(racePlayer, NOW);

        assertEquals(RacePlayerStatus.FINISHED, racePlayer.getStatus());
        verify(gameplayPresenceService).markOffline(racePlayer);
        verify(gameplayPresenceService, never()).recordGameplayActivity(racePlayer, NOW);
        verify(racePlayerRepository, never()).save(racePlayer);
    }

    @Test
    void expiredGracePersistsDisconnectMarksOfflineAndRejects() {
        RacePlayerGameplayPresenceService.GameplayPresenceDecision decision =
                decision(true, false, true);
        when(gameplayPresenceService.resolve(racePlayer, NOW)).thenReturn(decision);
        when(gameplayTimelineService.settleGameplayRequest(
                racePlayer,
                NOW,
                decision
        )).thenAnswer(invocation -> {
            racePlayer.setStatus(RacePlayerStatus.DISCONNECTED);
            return true;
        });

        ApiException exception = assertThrows(
                ApiException.class,
                () -> guard.requireGameplayAccess(racePlayer, NOW)
        );

        assertEquals(
                ErrorCode.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED,
                exception.getErrorCode()
        );
        assertEquals(RacePlayerStatus.DISCONNECTED, racePlayer.getStatus());
        verify(racePlayerRepository).save(racePlayer);
        verify(gameplayPresenceService).markOffline(racePlayer);
        verify(gameplayPresenceService, never()).recordGameplayActivity(racePlayer, NOW);
    }

    @Test
    void unavailableRedisFailsOpenWithDurableActivityFallback() {
        RacePlayerGameplayPresenceService.GameplayPresenceDecision decision =
                decision(false, true, false);
        when(gameplayPresenceService.resolve(racePlayer, NOW)).thenReturn(decision);

        guard.requireGameplayAccess(racePlayer, NOW);

        verify(gameplayTimelineService).settleGameplayRequest(
                racePlayer,
                NOW,
                decision
        );
        verify(gameplayPresenceService).recordGameplayActivity(racePlayer, NOW);
        verify(racePlayerRepository, never()).save(racePlayer);
    }

    private RacePlayerGameplayPresenceService.GameplayPresenceDecision decision(
            boolean redisAvailable,
            boolean online,
            boolean graceExpired
    ) {
        return new RacePlayerGameplayPresenceService.GameplayPresenceDecision(
                redisAvailable,
                online,
                graceExpired,
                NOW.minusSeconds(1).toEpochMilli()
        );
    }
}
