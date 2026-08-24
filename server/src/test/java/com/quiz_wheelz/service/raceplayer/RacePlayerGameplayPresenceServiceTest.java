package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerGameplayPresenceServiceTest {

    private static final long RACE_ID = 7L;
    private static final long PLAYER_ID = 71L;
    private static final Instant NOW = Instant.parse("2026-08-20T10:10:00Z");

    @Mock
    private RedisPresenceService redisPresenceService;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    private RacePlayerGameplayPresenceService service;

    @BeforeEach
    void setUp() {
        service = new RacePlayerGameplayPresenceService(
                redisPresenceService,
                racePlayerRepository,
                new RacePlayerReconnectPolicy(),
                Clock.fixed(NOW, ZoneOffset.UTC)
        );
    }

    @Test
    void shouldUseLatestTrustedActivityAsAbsentMovementCutoff() {
        RacePlayer player = racingPlayer(NOW.minusSeconds(90));
        Instant redisActivity = NOW.minusSeconds(30);
        when(redisPresenceService.isOnline(RACE_ID, PLAYER_ID)).thenReturn(false);
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, PLAYER_ID))
                .thenReturn(Optional.of(redisActivity));

        GameplayPresenceDecision decision = service.resolve(player, NOW);

        assertTrue(decision.redisAvailable());
        assertFalse(decision.online());
        assertFalse(decision.graceExpired());
        assertFalse(decision.blocksRaceCompletion());
        assertEquals(redisActivity.toEpochMilli(), decision.movementCutoffEpochMs());
    }

    @Test
    void shouldClassifyGraceExpiredWithoutUsingBackgroundWorkAsActivity() {
        RacePlayer player = racingPlayer(NOW.minusSeconds(400));
        when(redisPresenceService.isOnline(RACE_ID, PLAYER_ID)).thenReturn(false);
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, PLAYER_ID))
                .thenReturn(Optional.of(NOW.minusSeconds(400)));

        GameplayPresenceDecision decision = service.resolve(player, NOW);

        assertTrue(decision.graceExpired());
        assertFalse(decision.blocksRaceCompletion());
        verify(redisPresenceService, never()).renewPresenceLease(RACE_ID, PLAYER_ID, NOW);
    }

    @Test
    void redisOutageShouldFailOpenForMovementAndRaceCompletion() {
        RacePlayer player = racingPlayer(NOW.minusSeconds(400));
        when(redisPresenceService.isOnline(RACE_ID, PLAYER_ID))
                .thenThrow(new DataAccessResourceFailureException("redis unavailable"));

        GameplayPresenceDecision decision = service.resolve(player, NOW);

        assertFalse(decision.redisAvailable());
        assertTrue(decision.online());
        assertFalse(decision.graceExpired());
        assertTrue(decision.blocksRaceCompletion());
        assertEquals(NOW.toEpochMilli(), decision.movementCutoffEpochMs());
    }

    @Test
    void untrustedConsequenceShouldUseLatestTrustedActivityWithoutWritingActivity() {
        RacePlayer player = racingPlayer(NOW.minusSeconds(90));
        Instant redisActivity = NOW.minusSeconds(30);
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, PLAYER_ID))
                .thenReturn(Optional.of(redisActivity));

        long cutoff = service.resolveUntrustedActivityCutoff(player, NOW);

        assertEquals(redisActivity.toEpochMilli(), cutoff);
        verify(redisPresenceService, never())
                .recordGameplayActivity(RACE_ID, PLAYER_ID, NOW);
        verify(redisPresenceService, never())
                .renewPresenceLease(RACE_ID, PLAYER_ID, NOW);
        verify(racePlayerRepository, never()).save(player);
    }

    @Test
    void untrustedConsequenceShouldUseDurableCutoffDuringRedisOutage() {
        Instant durableActivity = NOW.minusSeconds(90);
        RacePlayer player = racingPlayer(durableActivity);
        when(redisPresenceService.findLastGameplayActivityAt(RACE_ID, PLAYER_ID))
                .thenThrow(new DataAccessResourceFailureException("redis unavailable"));

        long cutoff = service.resolveUntrustedActivityCutoff(player, NOW);

        assertEquals(durableActivity.toEpochMilli(), cutoff);
        verify(redisPresenceService, never())
                .recordGameplayActivity(RACE_ID, PLAYER_ID, NOW);
        verify(redisPresenceService, never())
                .renewPresenceLease(RACE_ID, PLAYER_ID, NOW);
        verify(racePlayerRepository, never()).save(player);
    }

    @Test
    void recordGameplayActivityShouldKeepDurableTimestampMonotonic() {
        RacePlayer player = racingPlayer(NOW.minusSeconds(10));

        service.recordGameplayActivity(player, NOW.minusSeconds(20));

        assertEquals(
                LocalDateTime.ofInstant(NOW.minusSeconds(10), ZoneOffset.UTC),
                player.getLastSeenAt()
        );
        verify(redisPresenceService).recordGameplayActivity(
                RACE_ID,
                PLAYER_ID,
                NOW.minusSeconds(20)
        );
        verify(racePlayerRepository, never()).save(player);
    }

    @Test
    void healthyRedisActivityShouldNotDirtyDurableLastSeen() {
        RacePlayer player = racingPlayer(NOW.minusSeconds(30));

        service.recordGameplayActivity(player, NOW);

        assertEquals(
                LocalDateTime.ofInstant(NOW.minusSeconds(30), ZoneOffset.UTC),
                player.getLastSeenAt()
        );
        verify(redisPresenceService).recordGameplayActivity(RACE_ID, PLAYER_ID, NOW);
        verify(redisPresenceService, never()).renewPresenceLease(RACE_ID, PLAYER_ID, NOW);
        verify(racePlayerRepository, never()).save(player);
    }

    @Test
    void renewPresenceLeaseShouldUseFocusedRedisOperation() {
        RacePlayer player = racingPlayer(NOW.minusSeconds(30));

        service.renewPresenceLease(player, NOW);

        verify(redisPresenceService).renewPresenceLease(RACE_ID, PLAYER_ID, NOW);
        verify(redisPresenceService, never()).recordGameplayActivity(RACE_ID, PLAYER_ID, NOW);
        verify(racePlayerRepository, never()).save(player);
    }

    @Test
    void redisWriteFailureShouldPersistNewerDurableFallback() {
        RacePlayer player = racingPlayer(NOW.minusSeconds(30));
        org.mockito.Mockito.doThrow(
                        new DataAccessResourceFailureException("redis unavailable")
                )
                .when(redisPresenceService)
                .recordGameplayActivity(RACE_ID, PLAYER_ID, NOW);

        service.recordGameplayActivity(player, NOW);

        assertEquals(LocalDateTime.ofInstant(NOW, ZoneOffset.UTC), player.getLastSeenAt());
        verify(racePlayerRepository).save(player);
    }

    @Test
    void redisWriteFailureShouldNotPersistOlderDurableFallback() {
        RacePlayer player = racingPlayer(NOW);
        Instant olderActivity = NOW.minusSeconds(30);
        org.mockito.Mockito.doThrow(
                        new DataAccessResourceFailureException("redis unavailable")
                )
                .when(redisPresenceService)
                .recordGameplayActivity(RACE_ID, PLAYER_ID, olderActivity);

        service.recordGameplayActivity(player, olderActivity);

        assertEquals(LocalDateTime.ofInstant(NOW, ZoneOffset.UTC), player.getLastSeenAt());
        verify(racePlayerRepository, never()).save(player);
    }

    private RacePlayer racingPlayer(Instant lastSeenAt) {
        Race race = new Race();
        race.setId(RACE_ID);
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setStartedAt(LocalDateTime.ofInstant(NOW.minusSeconds(600), ZoneOffset.UTC));

        RacePlayer player = new RacePlayer();
        player.setId(PLAYER_ID);
        player.setRace(race);
        player.setStatus(RacePlayerStatus.RACING);
        player.setLastSeenAt(LocalDateTime.ofInstant(lastSeenAt, ZoneOffset.UTC));
        return player;
    }
}
