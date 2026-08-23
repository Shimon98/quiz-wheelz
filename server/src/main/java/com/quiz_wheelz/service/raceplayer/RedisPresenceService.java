package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RacePlayerRuntimeRules;
import com.quiz_wheelz.common.redis.RedisKeyBuilder;
import com.quiz_wheelz.exception.ErrorMessages;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.DateTimeException;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class RedisPresenceService {

    private static final DefaultRedisScript<Long> RENEW_PRESENCE_LEASE_SCRIPT =
            new DefaultRedisScript<>("""
                    local incoming = tonumber(ARGV[1])
                    local currentRaw = redis.call('GET', KEYS[2])
                    local current = tonumber(currentRaw)
                    if (not current) or incoming > current then
                        redis.call('SET', KEYS[2], ARGV[1], 'PX', ARGV[3])
                    else
                        redis.call('PEXPIRE', KEYS[2], ARGV[3])
                    end
                    redis.call('SET', KEYS[1], ARGV[4], 'PX', ARGV[2])
                    return 1
                    """, Long.class);
    private static final DefaultRedisScript<Long> RENEW_EXISTING_PRESENCE_LEASE_SCRIPT =
            new DefaultRedisScript<>("""
                    if redis.call('EXISTS', KEYS[1]) == 0 then
                        return 0
                    end
                    local incoming = tonumber(ARGV[1])
                    local currentRaw = redis.call('GET', KEYS[2])
                    local current = tonumber(currentRaw)
                    if (not current) or incoming > current then
                        redis.call('SET', KEYS[2], ARGV[1], 'PX', ARGV[3])
                    else
                        redis.call('PEXPIRE', KEYS[2], ARGV[3])
                    end
                    redis.call('PEXPIRE', KEYS[1], ARGV[2])
                    return 1
                    """, Long.class);
    private static final DefaultRedisScript<Long> RECORD_GAMEPLAY_ACTIVITY_SCRIPT =
            new DefaultRedisScript<>("""
                    local incoming = tonumber(ARGV[1])
                    local currentRaw = redis.call('GET', KEYS[1])
                    local current = tonumber(currentRaw)
                    if (not current) or incoming > current then
                        redis.call('SET', KEYS[1], ARGV[1], 'PX', ARGV[2])
                    else
                        redis.call('PEXPIRE', KEYS[1], ARGV[2])
                    end
                    return 1
                    """, Long.class);

    private final StringRedisTemplate redisTemplate;
    private final RedisKeyBuilder redisKeyBuilder;

    public RedisPresenceService(
            StringRedisTemplate redisTemplate,
            RedisKeyBuilder redisKeyBuilder
    ) {
        this.redisTemplate = Objects.requireNonNull(redisTemplate);
        this.redisKeyBuilder = Objects.requireNonNull(redisKeyBuilder);
    }

    public void renewPresenceLease(
            Long raceId,
            Long racePlayerId,
            Instant activityAt
    ) {
        validateIds(raceId, racePlayerId);

        if (activityAt == null) {
            throw new IllegalArgumentException(
                    ErrorMessages.REDIS_GAMEPLAY_ACTIVITY_TIMESTAMP_MISSING
            );
        }

        redisTemplate.execute(
                RENEW_PRESENCE_LEASE_SCRIPT,
                List.of(
                        buildPresenceKey(raceId, racePlayerId),
                        buildLastGameplayActivityKey(raceId, racePlayerId)
                ),
                Long.toString(activityAt.toEpochMilli()),
                Long.toString(RacePlayerRuntimeRules.PRESENCE_TTL.toMillis()),
                Long.toString(RacePlayerRuntimeRules.LAST_GAMEPLAY_ACTIVITY_TTL.toMillis()),
                RacePlayerRuntimeRules.REDIS_PRESENCE_VALUE
        );
    }

    public boolean renewExistingPresenceLease(
            Long raceId,
            Long racePlayerId,
            Instant activityAt
    ) {
        validateIds(raceId, racePlayerId);

        if (activityAt == null) {
            throw new IllegalArgumentException(
                    ErrorMessages.REDIS_GAMEPLAY_ACTIVITY_TIMESTAMP_MISSING
            );
        }

        Long refreshed = redisTemplate.execute(
                RENEW_EXISTING_PRESENCE_LEASE_SCRIPT,
                List.of(
                        buildPresenceKey(raceId, racePlayerId),
                        buildLastGameplayActivityKey(raceId, racePlayerId)
                ),
                Long.toString(activityAt.toEpochMilli()),
                Long.toString(RacePlayerRuntimeRules.PRESENCE_TTL.toMillis()),
                Long.toString(RacePlayerRuntimeRules.LAST_GAMEPLAY_ACTIVITY_TTL.toMillis())
        );

        return Long.valueOf(1L).equals(refreshed);
    }

    public void recordGameplayActivity(
            Long raceId,
            Long racePlayerId,
            Instant activityAt
    ) {
        validateIds(raceId, racePlayerId);

        if (activityAt == null) {
            throw new IllegalArgumentException(
                    ErrorMessages.REDIS_GAMEPLAY_ACTIVITY_TIMESTAMP_MISSING
            );
        }

        redisTemplate.execute(
                RECORD_GAMEPLAY_ACTIVITY_SCRIPT,
                List.of(buildLastGameplayActivityKey(raceId, racePlayerId)),
                Long.toString(activityAt.toEpochMilli()),
                Long.toString(RacePlayerRuntimeRules.LAST_GAMEPLAY_ACTIVITY_TTL.toMillis())
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

    public Optional<Instant> findLastGameplayActivityAt(
            Long raceId,
            Long racePlayerId
    ) {
        validateIds(raceId, racePlayerId);

        String value = redisTemplate.opsForValue()
                .get(buildLastGameplayActivityKey(raceId, racePlayerId));

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

    String buildLastGameplayActivityKey(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);

        return redisKeyBuilder.presenceLastGameplayActivityKey(raceId, racePlayerId);
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
