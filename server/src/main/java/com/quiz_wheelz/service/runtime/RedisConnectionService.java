package com.quiz_wheelz.service.runtime;

import com.quiz_wheelz.config.RedisRuntimeConfig;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class RedisConnectionService {

    private static final String PONG = "PONG";

    private final RedisRuntimeConfig redisRuntimeConfig;
    private final RedisConnectionFactory redisConnectionFactory;

    public RedisConnectionService(
            RedisRuntimeConfig redisRuntimeConfig,
            RedisConnectionFactory redisConnectionFactory
    ) {
        this.redisRuntimeConfig = Objects.requireNonNull(redisRuntimeConfig);
        this.redisConnectionFactory = Objects.requireNonNull(redisConnectionFactory);
    }

    public boolean isEnabled() {
        return redisRuntimeConfig.isEnabled();
    }

    public boolean isRequired() {
        return redisRuntimeConfig.isRequired();
    }

    public boolean ping() {
        if (!redisRuntimeConfig.isEnabled()) {
            return false;
        }

        try (RedisConnection connection = redisConnectionFactory.getConnection()) {
            String response = connection.ping();
            return PONG.equalsIgnoreCase(response);
        } catch (RuntimeException ex) {
            return false;
        }
    }
}
