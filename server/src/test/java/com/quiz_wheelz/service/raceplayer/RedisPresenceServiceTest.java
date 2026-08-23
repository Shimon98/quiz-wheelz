package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RacePlayerRuntimeRules;
import com.quiz_wheelz.common.redis.RedisKeyBuilder;
import com.quiz_wheelz.config.ConfigPropertyKeys;
import com.quiz_wheelz.config.RedisRuntimeConfig;
import com.quiz_wheelz.exception.ErrorMessages;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.mock.env.MockEnvironment;

import java.time.Instant;
import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RedisPresenceServiceTest {

    private static final long RACE_ID = 1L;
    private static final long RACE_PLAYER_ID = 12L;
    private static final String PRESENCE_KEY =
            "quizwheelz:test:presence:race:1:player:12";
    private static final String LAST_GAMEPLAY_ACTIVITY_KEY =
            "quizwheelz:test:presence:last-gameplay-activity:race:1:player:12";
    private static final String LAST_SEEN_DB_SYNC_KEY =
            "quizwheelz:test:presence:race:1:player:12:last-seen-db-sync";
    private static final Instant GAMEPLAY_ACTIVITY_AT =
            Instant.parse("2026-07-06T13:20:00Z");

    private StringRedisTemplate redisTemplate;
    private ValueOperations<String, String> valueOperations;
    private RedisPresenceService redisPresenceService;

    @BeforeEach
    void setUp() {
        redisTemplate = mock(StringRedisTemplate.class);
        valueOperations = mock(ValueOperations.class);

        redisPresenceService = new RedisPresenceService(
                redisTemplate,
                createRedisKeyBuilder()
        );
    }

    @Test
    void renewPresenceLeaseShouldStorePresenceValueWithTtl() {
        redisPresenceService.renewPresenceLease(RACE_ID, RACE_PLAYER_ID, GAMEPLAY_ACTIVITY_AT);

        verify(redisTemplate).execute(
                any(DefaultRedisScript.class),
                eq(List.of(PRESENCE_KEY, LAST_GAMEPLAY_ACTIVITY_KEY)),
                eq(Long.toString(GAMEPLAY_ACTIVITY_AT.toEpochMilli())),
                eq(Long.toString(RacePlayerRuntimeRules.PRESENCE_TTL.toMillis())),
                eq(Long.toString(
                        RacePlayerRuntimeRules.LAST_GAMEPLAY_ACTIVITY_TTL.toMillis()
                )),
                eq(RacePlayerRuntimeRules.REDIS_PRESENCE_VALUE)
        );
    }

    @Test
    void renewPresenceLeaseShouldStoreLastGameplayActivityKeyWithLongTtl() {
        redisPresenceService.renewPresenceLease(RACE_ID, RACE_PLAYER_ID, GAMEPLAY_ACTIVITY_AT);

        verify(redisTemplate).execute(
                any(DefaultRedisScript.class),
                eq(List.of(PRESENCE_KEY, LAST_GAMEPLAY_ACTIVITY_KEY)),
                eq(Long.toString(GAMEPLAY_ACTIVITY_AT.toEpochMilli())),
                eq(Long.toString(RacePlayerRuntimeRules.PRESENCE_TTL.toMillis())),
                eq(Long.toString(
                        RacePlayerRuntimeRules.LAST_GAMEPLAY_ACTIVITY_TTL.toMillis()
                )),
                eq(RacePlayerRuntimeRules.REDIS_PRESENCE_VALUE)
        );
    }

    @Test
    void renewExistingPresenceLeaseShouldRefreshExistingPresenceAtomically() {
        when(redisTemplate.execute(
                any(DefaultRedisScript.class),
                eq(List.of(PRESENCE_KEY, LAST_GAMEPLAY_ACTIVITY_KEY)),
                eq(Long.toString(GAMEPLAY_ACTIVITY_AT.toEpochMilli())),
                eq(Long.toString(RacePlayerRuntimeRules.PRESENCE_TTL.toMillis())),
                eq(Long.toString(
                        RacePlayerRuntimeRules.LAST_GAMEPLAY_ACTIVITY_TTL.toMillis()
                ))
        )).thenReturn(1L);

        boolean refreshed = redisPresenceService.renewExistingPresenceLease(
                RACE_ID,
                RACE_PLAYER_ID,
                GAMEPLAY_ACTIVITY_AT
        );

        assertTrue(refreshed);
    }

    @Test
    void renewExistingPresenceLeaseShouldNotRecreateMissingPresence() {
        when(redisTemplate.execute(
                any(DefaultRedisScript.class),
                eq(List.of(PRESENCE_KEY, LAST_GAMEPLAY_ACTIVITY_KEY)),
                eq(Long.toString(GAMEPLAY_ACTIVITY_AT.toEpochMilli())),
                eq(Long.toString(RacePlayerRuntimeRules.PRESENCE_TTL.toMillis())),
                eq(Long.toString(
                        RacePlayerRuntimeRules.LAST_GAMEPLAY_ACTIVITY_TTL.toMillis()
                ))
        )).thenReturn(0L);

        boolean refreshed = redisPresenceService.renewExistingPresenceLease(
                RACE_ID,
                RACE_PLAYER_ID,
                GAMEPLAY_ACTIVITY_AT
        );

        assertFalse(refreshed);
    }

    @Test
    void recordGameplayActivityShouldWriteOnlyTheActivityKey() {
        redisPresenceService.recordGameplayActivity(
                RACE_ID,
                RACE_PLAYER_ID,
                GAMEPLAY_ACTIVITY_AT
        );

        verify(redisTemplate).execute(
                any(DefaultRedisScript.class),
                eq(List.of(LAST_GAMEPLAY_ACTIVITY_KEY)),
                eq(Long.toString(GAMEPLAY_ACTIVITY_AT.toEpochMilli())),
                eq(Long.toString(
                        RacePlayerRuntimeRules.LAST_GAMEPLAY_ACTIVITY_TTL.toMillis()
                ))
        );
    }

    @Test
    void findLastGameplayActivityAtShouldReturnParsedTimestamp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(LAST_GAMEPLAY_ACTIVITY_KEY))
                .thenReturn(Long.toString(GAMEPLAY_ACTIVITY_AT.toEpochMilli()));

        Optional<Instant> gameplayActivityAt =
                redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID);

        assertTrue(gameplayActivityAt.isPresent());
        assertEquals(GAMEPLAY_ACTIVITY_AT, gameplayActivityAt.get());
    }

    @Test
    void findLastGameplayActivityAtShouldReturnEmptyWhenKeyIsMissing() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(LAST_GAMEPLAY_ACTIVITY_KEY)).thenReturn(null);

        Optional<Instant> gameplayActivityAt =
                redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID);

        assertTrue(gameplayActivityAt.isEmpty());
    }

    @Test
    void findLastGameplayActivityAtShouldReturnEmptyWhenValueIsInvalid() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(LAST_GAMEPLAY_ACTIVITY_KEY)).thenReturn("not-a-number");

        Optional<Instant> gameplayActivityAt =
                redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID);

        assertTrue(gameplayActivityAt.isEmpty());
    }

    @Test
    void findLastGameplayActivityAtShouldTreatLegacyIsoValueAsUnusable() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(LAST_GAMEPLAY_ACTIVITY_KEY)).thenReturn("2026-07-06T13:20:00");

        Optional<Instant> gameplayActivityAt =
                redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID);

        assertTrue(gameplayActivityAt.isEmpty());
    }

    @Test
    void findLastGameplayActivityAtShouldRejectNonPositiveEpoch() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(LAST_GAMEPLAY_ACTIVITY_KEY)).thenReturn("0");

        Optional<Instant> gameplayActivityAt =
                redisPresenceService.findLastGameplayActivityAt(RACE_ID, RACE_PLAYER_ID);

        assertTrue(gameplayActivityAt.isEmpty());
    }

    @Test
    void markOfflineShouldDeletePresenceKeyOnly() {
        redisPresenceService.markOffline(RACE_ID, RACE_PLAYER_ID);

        verify(redisTemplate).delete(PRESENCE_KEY);
        verify(redisTemplate, never()).delete(LAST_GAMEPLAY_ACTIVITY_KEY);
    }

    @Test
    void checkpointGateShouldUseAtomicSetIfAbsentWithCanonicalInterval() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(
                LAST_SEEN_DB_SYNC_KEY,
                RacePlayerRuntimeRules.REDIS_PRESENCE_VALUE,
                RacePlayerRuntimeRules.LAST_SEEN_DB_CHECKPOINT_INTERVAL
        )).thenReturn(true);

        assertTrue(redisPresenceService.tryAcquireLastSeenDbSyncGate(
                RACE_ID,
                RACE_PLAYER_ID
        ));
    }

    @Test
    void checkpointGateShouldRemainClosedWhenKeyAlreadyExists() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.setIfAbsent(
                LAST_SEEN_DB_SYNC_KEY,
                RacePlayerRuntimeRules.REDIS_PRESENCE_VALUE,
                RacePlayerRuntimeRules.LAST_SEEN_DB_CHECKPOINT_INTERVAL
        )).thenReturn(false);

        assertFalse(redisPresenceService.tryAcquireLastSeenDbSyncGate(
                RACE_ID,
                RACE_PLAYER_ID
        ));
    }

    @Test
    void releaseCheckpointGateShouldDeleteOnlyGateKey() {
        redisPresenceService.releaseLastSeenDbSyncGate(RACE_ID, RACE_PLAYER_ID);

        verify(redisTemplate).delete(LAST_SEEN_DB_SYNC_KEY);
    }

    @Test
    void isOnlineShouldReturnTrueWhenRedisHasKey() {
        when(redisTemplate.hasKey(PRESENCE_KEY)).thenReturn(true);

        boolean online = redisPresenceService.isOnline(RACE_ID, RACE_PLAYER_ID);

        assertTrue(online);
    }

    @Test
    void isOnlineShouldReturnFalseWhenRedisDoesNotHaveKey() {
        when(redisTemplate.hasKey(PRESENCE_KEY)).thenReturn(false);

        boolean online = redisPresenceService.isOnline(RACE_ID, RACE_PLAYER_ID);

        assertFalse(online);
    }

    @Test
    void nullRaceIdShouldThrowConstantErrorMessage() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> redisPresenceService.renewPresenceLease(
                        null,
                        RACE_PLAYER_ID,
                        GAMEPLAY_ACTIVITY_AT
                )
        );

        assertEquals(ErrorMessages.REDIS_PRESENCE_IDS_MISSING, exception.getMessage());
    }

    @Test
    void nullRacePlayerIdShouldThrowConstantErrorMessage() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> redisPresenceService.renewPresenceLease(
                        RACE_ID,
                        null,
                        GAMEPLAY_ACTIVITY_AT
                )
        );

        assertEquals(ErrorMessages.REDIS_PRESENCE_IDS_MISSING, exception.getMessage());
    }

    @Test
    void nullGameplayActivityTimestampShouldThrowConstantErrorMessage() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> redisPresenceService.renewPresenceLease(
                        RACE_ID,
                        RACE_PLAYER_ID,
                        null
                )
        );

        assertEquals(
                ErrorMessages.REDIS_GAMEPLAY_ACTIVITY_TIMESTAMP_MISSING,
                exception.getMessage()
        );
    }

    @Test
    void buildPresenceKeyShouldUseSharedRedisKeyBuilderConvention() {
        String key = redisPresenceService.buildPresenceKey(RACE_ID, RACE_PLAYER_ID);

        assertEquals(PRESENCE_KEY, key);
    }

    @Test
    void buildLastGameplayActivityKeyShouldUseSharedRedisKeyBuilderConvention() {
        String key = redisPresenceService.buildLastGameplayActivityKey(
                RACE_ID,
                RACE_PLAYER_ID
        );

        assertEquals(LAST_GAMEPLAY_ACTIVITY_KEY, key);
    }

    @Test
    void buildLastSeenDbSyncKeyShouldUseSharedRedisKeyBuilderConvention() {
        assertEquals(
                LAST_SEEN_DB_SYNC_KEY,
                redisPresenceService.buildLastSeenDbSyncKey(RACE_ID, RACE_PLAYER_ID)
        );
    }

    private RedisKeyBuilder createRedisKeyBuilder() {
        MockEnvironment env = new MockEnvironment()
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_REDIS_KEY_PREFIX, "quizwheelz:test");

        RedisRuntimeConfig config = new RedisRuntimeConfig(env);
        config.init();

        return new RedisKeyBuilder(config);
    }
}
