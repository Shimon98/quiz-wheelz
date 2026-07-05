package com.quiz_wheelz.service.runtime;

import com.quiz_wheelz.config.RedisRuntimeConfig;
import com.quiz_wheelz.exception.ConfigurationException;
import com.quiz_wheelz.exception.ErrorMessages;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class RedisStartupVerifier implements ApplicationRunner {

    private final RedisRuntimeConfig redisRuntimeConfig;
    private final RedisConnectionService redisConnectionService;

    public RedisStartupVerifier(
            RedisRuntimeConfig redisRuntimeConfig,
            RedisConnectionService redisConnectionService
    ) {
        this.redisRuntimeConfig = Objects.requireNonNull(redisRuntimeConfig);
        this.redisConnectionService = Objects.requireNonNull(redisConnectionService);
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!redisRuntimeConfig.isRequired()) {
            return;
        }

        if (!redisConnectionService.ping()) {
            throw new ConfigurationException(ErrorMessages.REDIS_REQUIRED_BUT_UNAVAILABLE);
        }
    }
}
