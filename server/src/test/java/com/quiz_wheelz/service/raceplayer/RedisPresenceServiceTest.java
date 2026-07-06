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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RedisPresenceServiceTest {

    private static final long RACE_ID = 1L;
    private static final long RACE_PLAYER_ID = 12L;
    private static final String PRESENCE_KEY =
            "quizwheelz:test:presence:race:1:player:12";

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

        redisPresenceService.markOnline(RACE_ID, RACE_PLAYER_ID);

        verify(valueOperations).set(
                PRESENCE_KEY,
                RacePlayerRuntimeRules.REDIS_PRESENCE_VALUE,
                RacePlayerRuntimeRules.PRESENCE_TTL
        );
    }

    @Test
    void markOfflineShouldDeletePresenceKey() {
        redisPresenceService.markOffline(RACE_ID, RACE_PLAYER_ID);

        verify(redisTemplate).delete(PRESENCE_KEY);
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
                () -> redisPresenceService.markOnline(null, RACE_PLAYER_ID)
        );

        assertEquals(ErrorMessages.REDIS_PRESENCE_IDS_MISSING, exception.getMessage());
    }

    @Test
    void nullRacePlayerIdShouldThrowConstantErrorMessage() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> redisPresenceService.markOnline(RACE_ID, null)
        );

        assertEquals(ErrorMessages.REDIS_PRESENCE_IDS_MISSING, exception.getMessage());
    }

    @Test
    void buildPresenceKeyShouldUseSharedRedisKeyBuilderConvention() {
        String key = redisPresenceService.buildPresenceKey(RACE_ID, RACE_PLAYER_ID);

        assertEquals(PRESENCE_KEY, key);
    }

    private RedisKeyBuilder createRedisKeyBuilder() {
        MockEnvironment env = new MockEnvironment()
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_REDIS_KEY_PREFIX, "quizwheelz:test");

        RedisRuntimeConfig config = new RedisRuntimeConfig(env);
        config.init();

        return new RedisKeyBuilder(config);
    }
}
