package com.quiz_wheelz.common.redis;

import com.quiz_wheelz.config.RedisRuntimeConfig;
import com.quiz_wheelz.exception.ErrorMessages;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class RedisKeyBuilder {

    private final RedisRuntimeConfig redisRuntimeConfig;

    public RedisKeyBuilder(RedisRuntimeConfig redisRuntimeConfig) {
        this.redisRuntimeConfig = Objects.requireNonNull(redisRuntimeConfig);
    }

    public String presenceKey(Long raceId, Long racePlayerId) {
        return join(
                RedisKeyNamespace.PRESENCE.getValue(),
                RedisKeyPart.RACE.getValue(),
                requirePositiveId(raceId),
                RedisKeyPart.PLAYER.getValue(),
                requirePositiveId(racePlayerId)
        );
    }

    public String rateLimitKey(
            RedisRateLimitScope scope,
            RedisKeyIdentifier identifier
    ) {
        return join(
                RedisKeyNamespace.RATE_LIMIT.getValue(),
                requireScope(scope),
                requireIdentifier(identifier)
        );
    }

    public String raceRuntimeKey(Long raceId) {
        return join(
                RedisKeyNamespace.RACE_RUNTIME.getValue(),
                RedisKeyPart.RACE.getValue(),
                requirePositiveId(raceId)
        );
    }

    public String leaderboardKey(Long raceId) {
        return join(
                RedisKeyNamespace.LEADERBOARD.getValue(),
                RedisKeyPart.RACE.getValue(),
                requirePositiveId(raceId)
        );
    }

    public String sseKey(Long raceId) {
        return join(
                RedisKeyNamespace.SSE.getValue(),
                RedisKeyPart.RACE.getValue(),
                requirePositiveId(raceId)
        );
    }

    public String lockKey(
            RedisLockScope scope,
            RedisKeyIdentifier identifier
    ) {
        return join(
                RedisKeyNamespace.LOCK.getValue(),
                requireScope(scope),
                requireIdentifier(identifier)
        );
    }

    private String join(Object... parts) {
        StringBuilder builder = new StringBuilder(redisRuntimeConfig.getKeyPrefix());

        for (Object part : parts) {
            builder.append(RedisKeyRules.DELIMITER).append(requireSafePart(part));
        }

        return builder.toString();
    }

    private Long requirePositiveId(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException(ErrorMessages.REDIS_KEY_ID_MUST_BE_POSITIVE);
        }

        return id;
    }

    private String requireScope(RedisRateLimitScope scope) {
        return Objects.requireNonNull(scope, ErrorMessages.REDIS_KEY_PART_MISSING).getValue();
    }

    private String requireScope(RedisLockScope scope) {
        return Objects.requireNonNull(scope, ErrorMessages.REDIS_KEY_PART_MISSING).getValue();
    }

    private String requireIdentifier(RedisKeyIdentifier identifier) {
        return Objects.requireNonNull(identifier, ErrorMessages.REDIS_KEY_IDENTIFIER_MISSING).value();
    }

    private String requireSafePart(Object value) {
        if (value == null || value.toString().isBlank()) {
            throw new IllegalArgumentException(ErrorMessages.REDIS_KEY_PART_MISSING);
        }

        String part = value.toString();

        if (!part.matches(RedisKeyRules.KEY_PART_PATTERN)) {
            throw new IllegalArgumentException(ErrorMessages.REDIS_KEY_PART_INVALID);
        }

        return part;
    }
}
