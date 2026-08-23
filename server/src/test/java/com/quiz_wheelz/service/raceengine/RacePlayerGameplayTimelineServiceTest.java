package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RacePlayerGameplayTimelineServiceTest {

    private static final Instant NOW = Instant.parse("2026-08-20T10:10:00Z");
    private static final long CUTOFF = NOW.minusSeconds(60).toEpochMilli();

    @Mock
    private QuestionTimeoutService questionTimeoutService;

    @Mock
    private RaceMovementService raceMovementService;

    private RacePlayerGameplayTimelineService service;
    private RacePlayer player;

    @BeforeEach
    void setUp() {
        service = new RacePlayerGameplayTimelineService(
                questionTimeoutService,
                raceMovementService,
                Clock.fixed(NOW, ZoneOffset.UTC)
        );
        player = new RacePlayer();
        player.setStatus(RacePlayerStatus.RACING);
    }

    @Test
    void repeatedAbsentSweepsShouldAlwaysSettleOnlyToTrustedCutoff() {
        GameplayPresenceDecision absent = new GameplayPresenceDecision(
                true,
                false,
                false,
                CUTOFF
        );

        service.settleBackground(player, NOW, absent);
        service.settleBackground(player, NOW.plusSeconds(5), absent);

        verify(questionTimeoutService).settleWithOverdueTimeout(
                player,
                NOW.atZone(ZoneOffset.UTC).toLocalDateTime(),
                NOW.toEpochMilli(),
                CUTOFF
        );
        verify(questionTimeoutService).settleWithOverdueTimeout(
                player,
                NOW.plusSeconds(5).atZone(ZoneOffset.UTC).toLocalDateTime(),
                NOW.plusSeconds(5).toEpochMilli(),
                CUTOFF
        );
        verify(raceMovementService, never()).reanchorAt(player, NOW.toEpochMilli());
    }

    @Test
    void reconnectInsideGraceShouldSettleToCutoffThenReanchorWithoutCatchUp() {
        GameplayPresenceDecision absentInsideGrace = new GameplayPresenceDecision(
                true,
                false,
                false,
                CUTOFF
        );

        assertFalse(service.settleReconnect(player, NOW, absentInsideGrace));

        verify(questionTimeoutService).settleWithOverdueTimeout(
                player,
                NOW.atZone(ZoneOffset.UTC).toLocalDateTime(),
                NOW.toEpochMilli(),
                CUTOFF
        );
        verify(raceMovementService).reanchorAt(player, NOW.toEpochMilli());
    }

    @Test
    void absentGameplayRequestShouldSettleToCutoffWithoutReanchor() {
        GameplayPresenceDecision absentInsideGrace = new GameplayPresenceDecision(
                true,
                false,
                false,
                CUTOFF
        );

        assertFalse(service.settleGameplayRequest(player, NOW, absentInsideGrace));

        verify(questionTimeoutService).settleWithOverdueTimeout(
                player,
                NOW.atZone(ZoneOffset.UTC).toLocalDateTime(),
                NOW.toEpochMilli(),
                CUTOFF
        );
        verify(raceMovementService, never()).reanchorAt(player, NOW.toEpochMilli());
    }

    @Test
    void connectedActivityShouldSettleNormallyWithoutReanchor() {
        GameplayPresenceDecision connected = new GameplayPresenceDecision(
                true,
                true,
                false,
                CUTOFF
        );

        service.settleGameplayRequest(player, NOW, connected);

        verify(questionTimeoutService).settleWithOverdueTimeout(
                player,
                NOW.atZone(ZoneOffset.UTC).toLocalDateTime(),
                NOW.toEpochMilli(),
                NOW.toEpochMilli()
        );
        verify(raceMovementService, never()).reanchorAt(player, NOW.toEpochMilli());
    }

    @Test
    void graceExpiryShouldDisconnectWithoutCatchUp() {
        GameplayPresenceDecision expired = new GameplayPresenceDecision(
                true,
                false,
                true,
                CUTOFF
        );

        assertTrue(service.settleBackground(player, NOW, expired));

        assertEquals(RacePlayerStatus.DISCONNECTED, player.getStatus());
        verify(questionTimeoutService, times(1)).settleWithOverdueTimeout(
                player,
                NOW.atZone(ZoneOffset.UTC).toLocalDateTime(),
                NOW.toEpochMilli(),
                CUTOFF
        );
    }

    @Test
    void legitimatePreCutoffFinishShouldNotBeDowngradedAtGraceExpiry() {
        GameplayPresenceDecision expired = new GameplayPresenceDecision(
                true,
                false,
                true,
                CUTOFF
        );
        doAnswer(invocation -> {
            player.setStatus(RacePlayerStatus.FINISHED);
            return null;
        }).when(questionTimeoutService).settleWithOverdueTimeout(
                player,
                NOW.atZone(ZoneOffset.UTC).toLocalDateTime(),
                NOW.toEpochMilli(),
                CUTOFF
        );

        assertFalse(service.settleBackground(player, NOW, expired));

        assertEquals(RacePlayerStatus.FINISHED, player.getStatus());
    }

    @Test
    void finalizationShouldSettleToCutoffThenNormalizeRacingPlayer() {
        GameplayPresenceDecision absentInsideGrace = new GameplayPresenceDecision(
                true,
                false,
                false,
                CUTOFF
        );

        assertTrue(service.settleForRaceFinalization(
                player,
                NOW,
                absentInsideGrace
        ));

        assertEquals(RacePlayerStatus.DISCONNECTED, player.getStatus());
        verify(questionTimeoutService).settleWithOverdueTimeout(
                player,
                NOW.atZone(ZoneOffset.UTC).toLocalDateTime(),
                NOW.toEpochMilli(),
                CUTOFF
        );
    }

    @Test
    void finalizationShouldPreserveLegitimatePreCutoffFinish() {
        GameplayPresenceDecision absentInsideGrace = new GameplayPresenceDecision(
                true,
                false,
                false,
                CUTOFF
        );
        doAnswer(invocation -> {
            player.setStatus(RacePlayerStatus.FINISHED);
            return null;
        }).when(questionTimeoutService).settleWithOverdueTimeout(
                player,
                NOW.atZone(ZoneOffset.UTC).toLocalDateTime(),
                NOW.toEpochMilli(),
                CUTOFF
        );

        assertFalse(service.settleForRaceFinalization(
                player,
                NOW,
                absentInsideGrace
        ));

        assertEquals(RacePlayerStatus.FINISHED, player.getStatus());
    }
}
