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
import org.springframework.mock.env.MockEnvironment;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RedisPresenceServiceTest {

    private static final long RACE_ID = 1L;
    private static final long RACE_PLAYER_ID = 12L;
    private static final String PRESENCE_KEY =
            "quizwheelz:test:presence:race:1:player:12";
    private static final String LAST_HEARTBEAT_KEY =
            "quizwheelz:test:presence:last-heartbeat:race:1:player:12";
    private static final String LAST_SEEN_DB_SYNC_KEY =
            "quizwheelz:test:presence:race:1:player:12:last-seen-db-sync";
    // Redis heartbeats are absolute Unix-epoch moments (C1-02K).
    private static final Instant HEARTBEAT_AT =
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
    void markOnlineShouldStorePresenceValueWithTtl() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        redisPresenceService.markOnline(RACE_ID, RACE_PLAYER_ID, HEARTBEAT_AT);

        verify(valueOperations).set(
                PRESENCE_KEY,
                RacePlayerRuntimeRules.REDIS_PRESENCE_VALUE,
                RacePlayerRuntimeRules.PRESENCE_TTL
        );
    }

    @Test
    void markOnlineShouldStoreLastHeartbeatKeyWithLongTtl() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        redisPresenceService.markOnline(RACE_ID, RACE_PLAYER_ID, HEARTBEAT_AT);

        verify(valueOperations).set(
                LAST_HEARTBEAT_KEY,
                Long.toString(HEARTBEAT_AT.toEpochMilli()),
                RacePlayerRuntimeRules.LAST_HEARTBEAT_TTL
        );
    }

    @Test
    void findLastHeartbeatAtShouldReturnParsedTimestamp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(LAST_HEARTBEAT_KEY))
                .thenReturn(Long.toString(HEARTBEAT_AT.toEpochMilli()));

        Optional<Instant> heartbeatAt =
                redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID);

        assertTrue(heartbeatAt.isPresent());
        assertEquals(HEARTBEAT_AT, heartbeatAt.get());
    }

    @Test
    void findLastHeartbeatAtShouldReturnEmptyWhenKeyIsMissing() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(LAST_HEARTBEAT_KEY)).thenReturn(null);

        Optional<Instant> heartbeatAt =
                redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID);

        assertTrue(heartbeatAt.isEmpty());
    }

    @Test
    void findLastHeartbeatAtShouldReturnEmptyWhenValueIsInvalid() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(LAST_HEARTBEAT_KEY)).thenReturn("not-a-number");

        Optional<Instant> heartbeatAt =
                redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID);

        assertTrue(heartbeatAt.isEmpty());
    }

    @Test
    void findLastHeartbeatAtShouldTreatLegacyIsoValueAsUnusable() {
        // A leftover pre-epoch ISO_LOCAL_DATE_TIME value must not crash —
        // it reads as unusable and the durable DB fallback covers it.
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(LAST_HEARTBEAT_KEY)).thenReturn("2026-07-06T13:20:00");

        Optional<Instant> heartbeatAt =
                redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID);

        assertTrue(heartbeatAt.isEmpty());
    }

    @Test
    void findLastHeartbeatAtShouldRejectNonPositiveEpoch() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get(LAST_HEARTBEAT_KEY)).thenReturn("0");

        Optional<Instant> heartbeatAt =
                redisPresenceService.findLastHeartbeatAt(RACE_ID, RACE_PLAYER_ID);

        assertTrue(heartbeatAt.isEmpty());
    }

    @Test
    void markOfflineShouldDeletePresenceKeyOnly() {
        redisPresenceService.markOffline(RACE_ID, RACE_PLAYER_ID);

        verify(redisTemplate).delete(PRESENCE_KEY);
        verify(redisTemplate, never()).delete(LAST_HEARTBEAT_KEY);
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
                () -> redisPresenceService.markOnline(null, RACE_PLAYER_ID, HEARTBEAT_AT)
        );

        assertEquals(ErrorMessages.REDIS_PRESENCE_IDS_MISSING, exception.getMessage());
    }

    @Test
    void nullRacePlayerIdShouldThrowConstantErrorMessage() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> redisPresenceService.markOnline(RACE_ID, null, HEARTBEAT_AT)
        );

        assertEquals(ErrorMessages.REDIS_PRESENCE_IDS_MISSING, exception.getMessage());
    }

    @Test
    void nullHeartbeatTimestampShouldThrowConstantErrorMessage() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> redisPresenceService.markOnline(
                        RACE_ID,
                        RACE_PLAYER_ID,
                        null
                )
        );

        assertEquals(
                ErrorMessages.REDIS_HEARTBEAT_TIMESTAMP_MISSING,
                exception.getMessage()
        );
    }

    @Test
    void buildPresenceKeyShouldUseSharedRedisKeyBuilderConvention() {
        String key = redisPresenceService.buildPresenceKey(RACE_ID, RACE_PLAYER_ID);

        assertEquals(PRESENCE_KEY, key);
    }

    @Test
    void buildLastHeartbeatKeyShouldUseSharedRedisKeyBuilderConvention() {
        String key = redisPresenceService.buildLastHeartbeatKey(RACE_ID, RACE_PLAYER_ID);

        assertEquals(LAST_HEARTBEAT_KEY, key);
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
