package com.quiz_wheelz.config;

import com.quiz_wheelz.exception.ConfigurationException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RedisRuntimeConfigTest {

    @Test
    void shouldUseSafeDefaults() {
        RedisRuntimeConfig config = createConfig(new MockEnvironment());

        assertFalse(config.isEnabled());
        assertFalse(config.isRequired());
        assertFalse(config.isRequirePassword());
        assertEquals("quizwheelz:dev", config.getKeyPrefix());
    }

    @Test
    void shouldAcceptValidCustomConfig() {
        MockEnvironment env = new MockEnvironment()
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_REDIS_ENABLED, "true")
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_REDIS_REQUIRED, "true")
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_REDIS_REQUIRE_PASSWORD, "true")
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_REDIS_KEY_PREFIX, "quizwheelz:prod")
                .withProperty(ConfigPropertyKeys.SPRING_DATA_REDIS_PASSWORD, "secret");

        RedisRuntimeConfig config = createConfig(env);

        assertTrue(config.isEnabled());
        assertTrue(config.isRequired());
        assertTrue(config.isRequirePassword());
        assertEquals("quizwheelz:prod", config.getKeyPrefix());
    }

    @Test
    void shouldRejectRequiredRedisWhenDisabled() {
        MockEnvironment env = new MockEnvironment()
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_REDIS_ENABLED, "false")
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_REDIS_REQUIRED, "true");

        assertThrows(ConfigurationException.class, () -> createConfig(env));
    }

    @Test
    void shouldRejectBlankKeyPrefix() {
        MockEnvironment env = new MockEnvironment()
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_REDIS_KEY_PREFIX, " ");

        assertThrows(ConfigurationException.class, () -> createConfig(env));
    }

    @Test
    void shouldRejectInvalidKeyPrefix() {
        MockEnvironment env = new MockEnvironment()
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_REDIS_KEY_PREFIX, "quiz wheelz");

        assertThrows(ConfigurationException.class, () -> createConfig(env));
    }

    @Test
    void shouldRejectMissingPasswordWhenPasswordRequired() {
        MockEnvironment env = new MockEnvironment()
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_REDIS_ENABLED, "true")
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_REDIS_REQUIRE_PASSWORD, "true")
                .withProperty(ConfigPropertyKeys.SPRING_DATA_REDIS_PASSWORD, "");

        assertThrows(ConfigurationException.class, () -> createConfig(env));
    }

    private RedisRuntimeConfig createConfig(MockEnvironment env) {
        RedisRuntimeConfig config = new RedisRuntimeConfig(env);
        config.init();
        return config;
    }
}
