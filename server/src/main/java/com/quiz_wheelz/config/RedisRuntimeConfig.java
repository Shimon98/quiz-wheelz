package com.quiz_wheelz.config;

import com.quiz_wheelz.common.redis.RedisKeyRules;
import com.quiz_wheelz.exception.ConfigurationException;
import com.quiz_wheelz.exception.ErrorMessages;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Getter
@Component
public class RedisRuntimeConfig {

    private final Environment env;

    private boolean enabled;
    private boolean required;
    private boolean requirePassword;
    private String keyPrefix;
    private String redisPassword;

    public RedisRuntimeConfig(Environment env) {
        this.env = env;
    }

    @PostConstruct
    public void init() {
        this.enabled = env.getProperty(
                ConfigPropertyKeys.QUIZWHEELZ_REDIS_ENABLED,
                Boolean.class,
                false
        );

        this.required = env.getProperty(
                ConfigPropertyKeys.QUIZWHEELZ_REDIS_REQUIRED,
                Boolean.class,
                false
        );

        this.requirePassword = env.getProperty(
                ConfigPropertyKeys.QUIZWHEELZ_REDIS_REQUIRE_PASSWORD,
                Boolean.class,
                false
        );

        this.keyPrefix = env.getProperty(
                ConfigPropertyKeys.QUIZWHEELZ_REDIS_KEY_PREFIX,
                RedisKeyRules.DEFAULT_KEY_PREFIX
        );

        this.redisPassword = env.getProperty(
                ConfigPropertyKeys.SPRING_DATA_REDIS_PASSWORD,
                ""
        );

        validate();
    }

    private void validate() {
        validateRequiredRedisMode();
        validateKeyPrefix();
        validatePasswordPolicy();
    }

    private void validateRequiredRedisMode() {
        if (required && !enabled) {
            throw new ConfigurationException(ErrorMessages.REDIS_REQUIRED_BUT_DISABLED);
        }
    }

    private void validateKeyPrefix() {
        if (isBlank(keyPrefix)) {
            throw new ConfigurationException(ErrorMessages.REDIS_KEY_PREFIX_MISSING);
        }

        if (!keyPrefix.matches(RedisKeyRules.KEY_PREFIX_PATTERN)) {
            throw new ConfigurationException(ErrorMessages.REDIS_KEY_PREFIX_INVALID);
        }
    }

    private void validatePasswordPolicy() {
        if (enabled && requirePassword && isBlank(redisPassword)) {
            throw new ConfigurationException(ErrorMessages.REDIS_PASSWORD_REQUIRED);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
