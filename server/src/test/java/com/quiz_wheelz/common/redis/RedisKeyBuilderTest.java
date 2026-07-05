package com.quiz_wheelz.common.redis;

import com.quiz_wheelz.config.ConfigPropertyKeys;
import com.quiz_wheelz.config.RedisRuntimeConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RedisKeyBuilderTest {

    private RedisKeyBuilder redisKeyBuilder;

    @BeforeEach
    void setUp() {
        MockEnvironment env = new MockEnvironment()
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_REDIS_KEY_PREFIX, "quizwheelz:test");

        RedisRuntimeConfig config = new RedisRuntimeConfig(env);
        config.init();

        redisKeyBuilder = new RedisKeyBuilder(config);
    }

    @Test
    void shouldBuildPresenceKey() {
        String key = redisKeyBuilder.presenceKey(10L, 5L);

        assertEquals("quizwheelz:test:presence:race:10:player:5", key);
    }

    @Test
    void shouldBuildRateLimitKey() {
        String key = redisKeyBuilder.rateLimitKey(
                RedisRateLimitScope.SUBMIT_ANSWER,
                RedisKeyIdentifier.racePlayer(5L)
        );

        assertEquals("quizwheelz:test:rate-limit:submit-answer:player-5", key);
    }

    @Test
    void shouldBuildRaceRuntimeKey() {
        String key = redisKeyBuilder.raceRuntimeKey(10L);

        assertEquals("quizwheelz:test:race-runtime:race:10", key);
    }

    @Test
    void shouldBuildLeaderboardKey() {
        String key = redisKeyBuilder.leaderboardKey(10L);

        assertEquals("quizwheelz:test:leaderboard:race:10", key);
    }

    @Test
    void shouldBuildSseKey() {
        String key = redisKeyBuilder.sseKey(10L);

        assertEquals("quizwheelz:test:sse:race:10", key);
    }

    @Test
    void shouldBuildLockKey() {
        String key = redisKeyBuilder.lockKey(
                RedisLockScope.RACE_TICK,
                RedisKeyIdentifier.race(10L)
        );

        assertEquals("quizwheelz:test:lock:race-tick:race-10", key);
    }

    @Test
    void shouldRejectNullRaceId() {
        assertThrows(IllegalArgumentException.class, () -> redisKeyBuilder.raceRuntimeKey(null));
    }

    @Test
    void shouldRejectInvalidRaceId() {
        assertThrows(IllegalArgumentException.class, () -> redisKeyBuilder.raceRuntimeKey(0L));
    }

    @Test
    void shouldRejectNullRateLimitScope() {
        assertThrows(
                NullPointerException.class,
                () -> redisKeyBuilder.rateLimitKey(null, RedisKeyIdentifier.racePlayer(5L))
        );
    }
}
