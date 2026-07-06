package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RacePlayerRuntimeRules;
import com.quiz_wheelz.common.redis.RedisKeyBuilder;
import com.quiz_wheelz.exception.ErrorMessages;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Objects;

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

    public void markOnline(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);

        redisTemplate.opsForValue().set(
                buildPresenceKey(raceId, racePlayerId),
                RacePlayerRuntimeRules.REDIS_PRESENCE_VALUE,
                RacePlayerRuntimeRules.PRESENCE_TTL
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

    String buildPresenceKey(Long raceId, Long racePlayerId) {
        validateIds(raceId, racePlayerId);

        return redisKeyBuilder.presenceKey(raceId, racePlayerId);
    }

    private void validateIds(Long raceId, Long racePlayerId) {
        if (raceId == null || racePlayerId == null) {
            throw new IllegalArgumentException(ErrorMessages.REDIS_PRESENCE_IDS_MISSING);
        }
    }
}
