package com.quiz_wheelz.common.redis;

import com.quiz_wheelz.exception.ErrorMessages;

import java.util.Objects;

public record RedisKeyIdentifier(String value) {

    public RedisKeyIdentifier {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(ErrorMessages.REDIS_KEY_IDENTIFIER_MISSING);
        }
    }

    public static RedisKeyIdentifier racePlayer(Long racePlayerId) {
        return new RedisKeyIdentifier(
                RedisKeyRules.PLAYER_IDENTIFIER_PREFIX + requirePositiveId(racePlayerId)
        );
    }

    public static RedisKeyIdentifier race(Long raceId) {
        return new RedisKeyIdentifier(
                RedisKeyRules.RACE_IDENTIFIER_PREFIX + requirePositiveId(raceId)
        );
    }

    public static RedisKeyIdentifier ipAddress(String ipAddress) {
        return new RedisKeyIdentifier(
                RedisKeyRules.IP_IDENTIFIER_PREFIX + normalizeText(ipAddress)
        );
    }

    public static RedisKeyIdentifier username(String username) {
        return new RedisKeyIdentifier(
                RedisKeyRules.USERNAME_IDENTIFIER_PREFIX + normalizeText(username)
        );
    }

    private static Long requirePositiveId(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException(ErrorMessages.REDIS_KEY_ID_MUST_BE_POSITIVE);
        }

        return id;
    }

    private static String normalizeText(String value) {
        String normalized = Objects.requireNonNull(value)
                .trim()
                .toLowerCase()
                .replace(".", "_")
                .replace(":", "_")
                .replace("@", "_");

        if (normalized.isBlank()) {
            throw new IllegalArgumentException(ErrorMessages.REDIS_KEY_IDENTIFIER_MISSING);
        }

        if (!normalized.matches(RedisKeyRules.KEY_PART_PATTERN)) {
            throw new IllegalArgumentException(ErrorMessages.REDIS_KEY_PART_INVALID);
        }

        return normalized;
    }
}
