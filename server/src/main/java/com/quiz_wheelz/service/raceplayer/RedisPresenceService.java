package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RacePlayerRuntimeRules;
import com.quiz_wheelz.common.redis.RedisKeyBuilder;
import com.quiz_wheelz.exception.ErrorMessages;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.DateTimeException;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;

@Service
public class RedisPresenceService {

    private final StringRedisTemplate redisTemplate;
    private final RedisKeyBuilder redisKeyBuilder;

    public RedisPresenceService(
            StringRedisTemplate redisTemplate,
            RedisKeyBuilder redisKeyBuilder
    ) {
        this.redisTemplate = Objects.requireNonNull(redisTemplate);
        this.redisKeyBuilder = Objects.requireNonNull(redisKeyBuilder);
    }

    /*
     * Heartbeats are ABSOLUTE runtime moments, so Redis stores Unix epoch
     * milliseconds — never a zone-less LocalDateTime string. The caller
     * (RacePlayerRuntimeSessionService) owns the timestamp; there is no
     * hidden "now" here. A leftover pre-epoch ISO value simply parses as
     * unusable (Optional.empty) and the existing durable DB fallback covers
     * it until the next heartbeat rewrites the key.
     */
    public void markOnline(
            Long raceId,
            Long racePlayerId,
            Instant heartbeatAt
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
                Long.toString(heartbeatAt.toEpochMilli()),
                RacePlayerRuntimeRules.LAST_HEARTBEAT_TTL
        );
    }

    public void markOffline(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);

        redisTemplate.delete(buildPresenceKey(raceId, racePlayerId));
    }

    public boolean isOnline(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);

        return redisTemplate.hasKey(buildPresenceKey(raceId, racePlayerId));
    }

    public Optional<Instant> findLastHeartbeatAt(
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
            long epochMs = Long.parseLong(value);

            if (epochMs <= 0) {
                return Optional.empty();
            }

            return Optional.of(Instant.ofEpochMilli(epochMs));
        } catch (NumberFormatException | DateTimeException exception) {
            return Optional.empty();
        }
    }

    public boolean tryAcquireLastSeenDbSyncGate(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);

        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(
                buildLastSeenDbSyncKey(raceId, racePlayerId),
                RacePlayerRuntimeRules.REDIS_PRESENCE_VALUE,
                RacePlayerRuntimeRules.LAST_SEEN_DB_CHECKPOINT_INTERVAL
        );

        return Boolean.TRUE.equals(acquired);
    }

    public void releaseLastSeenDbSyncGate(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);
        redisTemplate.delete(buildLastSeenDbSyncKey(raceId, racePlayerId));
    }

    String buildPresenceKey(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);

        return redisKeyBuilder.presenceKey(raceId, racePlayerId);
    }

    String buildLastHeartbeatKey(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);

        return redisKeyBuilder.presenceLastHeartbeatKey(raceId, racePlayerId);
    }

    String buildLastSeenDbSyncKey(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);
        return redisKeyBuilder.presenceLastSeenDbSyncKey(raceId, racePlayerId);
    }

    private void validateIds(Long raceId, Long racePlayerId) {
        if (raceId == null || racePlayerId == null) {
            throw new IllegalArgumentException(ErrorMessages.REDIS_PRESENCE_IDS_MISSING);
        }
    }
}
