package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RacePlayerRuntimeRules;
import com.quiz_wheelz.common.redis.RedisKeyBuilder;
import com.quiz_wheelz.exception.ErrorMessages;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Objects;
import java.util.Optional;

@Service
public class RedisPresenceService {

    private static final DateTimeFormatter HEARTBEAT_FORMATTER =
            DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final StringRedisTemplate redisTemplate;
    private final RedisKeyBuilder redisKeyBuilder;

    public RedisPresenceService(
            StringRedisTemplate redisTemplate,
            RedisKeyBuilder redisKeyBuilder
    ) {
        this.redisTemplate = Objects.requireNonNull(redisTemplate);
        this.redisKeyBuilder = Objects.requireNonNull(redisKeyBuilder);
    }

    public void markOnline(Long raceId, Long racePlayerId) {
        markOnline(raceId, racePlayerId, LocalDateTime.now());
    }

    public void markOnline(
            Long raceId,
            Long racePlayerId,
            LocalDateTime heartbeatAt
    ) {
        validateIds(raceId, racePlayerId);

        if (heartbeatAt == null) {
            throw new IllegalArgumentException(ErrorMessages.REDIS_HEARTBEAT_TIMESTAMP_MISSING);
        }

        redisTemplate.opsForValue().set(
                buildPresenceKey(raceId, racePlayerId),
                RacePlayerRuntimeRules.REDIS_PRESENCE_VALUE,
                RacePlayerRuntimeRules.PRESENCE_TTL
        );

        redisTemplate.opsForValue().set(
                buildLastHeartbeatKey(raceId, racePlayerId),
                HEARTBEAT_FORMATTER.format(heartbeatAt),
                RacePlayerRuntimeRules.LAST_HEARTBEAT_TTL
        );
    }

    public void markOffline(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);

        redisTemplate.delete(buildPresenceKey(raceId, racePlayerId));
    }

    public boolean isOnline(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);

        Boolean exists = redisTemplate.hasKey(buildPresenceKey(raceId, racePlayerId));

        return Boolean.TRUE.equals(exists);
    }

    public Optional<LocalDateTime> findLastHeartbeatAt(
            Long raceId,
            Long racePlayerId
    ) {
        validateIds(raceId, racePlayerId);

        String value = redisTemplate.opsForValue()
                .get(buildLastHeartbeatKey(raceId, racePlayerId));

        if (value == null || value.isBlank()) {
            return Optional.empty();
        }

        try {
            return Optional.of(LocalDateTime.parse(value, HEARTBEAT_FORMATTER));
        } catch (DateTimeParseException exception) {
            return Optional.empty();
        }
    }

    String buildPresenceKey(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);

        return redisKeyBuilder.presenceKey(raceId, racePlayerId);
    }

    String buildLastHeartbeatKey(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);

        return redisKeyBuilder.presenceLastHeartbeatKey(raceId, racePlayerId);
    }

    private void validateIds(Long raceId, Long racePlayerId) {
        if (raceId == null || racePlayerId == null) {
            throw new IllegalArgumentException(ErrorMessages.REDIS_PRESENCE_IDS_MISSING);
        }
    }
}
