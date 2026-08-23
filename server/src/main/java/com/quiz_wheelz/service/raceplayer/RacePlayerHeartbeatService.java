package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerHeartbeatResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.utils.DateTimeUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Service
public class RacePlayerHeartbeatService {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(RacePlayerHeartbeatService.class);

    private final RacePlayerSessionLockService sessionLockService;
    private final RacePlayerRepository racePlayerRepository;
    private final RedisPresenceService redisPresenceService;
    private final RacePlayerReconnectPolicy reconnectPolicy;
    private final RacePlayerGameplayPresenceService gameplayPresenceService;
    private final RacePlayerGameplayTimelineService gameplayTimelineService;
    private final RacePlayerDisconnectService disconnectService;
    private final Clock clock;

    public RacePlayerHeartbeatService(
            RacePlayerSessionLockService sessionLockService,
            RacePlayerRepository racePlayerRepository,
            RedisPresenceService redisPresenceService,
            RacePlayerReconnectPolicy reconnectPolicy,
            RacePlayerGameplayPresenceService gameplayPresenceService,
            RacePlayerGameplayTimelineService gameplayTimelineService,
            RacePlayerDisconnectService disconnectService,
            Clock clock
    ) {
        this.sessionLockService = Objects.requireNonNull(sessionLockService);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.redisPresenceService = Objects.requireNonNull(redisPresenceService);
        this.reconnectPolicy = Objects.requireNonNull(reconnectPolicy);
        this.gameplayPresenceService = Objects.requireNonNull(gameplayPresenceService);
        this.gameplayTimelineService = Objects.requireNonNull(gameplayTimelineService);
        this.disconnectService = Objects.requireNonNull(disconnectService);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public RacePlayerHeartbeatResponse heartbeat(HttpServletRequest request) {
        RacePlayerSessionIdentity identity = sessionLockService.resolveIdentity(request);
        Instant nowInstant = clock.instant();
        LocalDateTime now = DateTimeUtils.toLocalDateTime(nowInstant, clock.getZone());
        RedisHeartbeatLookup redisHeartbeatLookup = readRedisHeartbeat(
                identity.raceId(),
                identity.racePlayerId(),
                RacePlayerRuntimeLogMessages.READ_HEARTBEAT
        );
        Optional<RacePlayer> expiredRacePlayer = findExpiredRacePlayer(
                identity,
                redisHeartbeatLookup.lastHeartbeatAt(),
                now
        );

        if (expiredRacePlayer.isPresent()) {
            disconnectService.disconnectForBackgroundExpiry(
                    expiredRacePlayer.get(),
                    nowInstant
            );
            throw new ApiException(ErrorCode.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED);
        }

        if (!redisHeartbeatLookup.available()) {
            checkpointLastSeen(identity, now);
            return heartbeatResponse(identity, now);
        }

        if (!redisHeartbeatLookup.online()) {
            RacePlayer racePlayer = sessionLockService.lock(identity);
            RacePlayerGameplayPresenceService.GameplayPresenceDecision presenceDecision =
                    gameplayPresenceService.resolve(racePlayer, nowInstant);
            gameplayTimelineService.settlePlayerActivity(
                    racePlayer,
                    nowInstant,
                    presenceDecision
            );
            gameplayPresenceService.recordPlayerActivity(racePlayer, nowInstant);
            return heartbeatResponse(identity, now);
        }

        if (!refreshHeartbeat(identity, nowInstant)) {
            checkpointLastSeen(identity, now);
            return heartbeatResponse(identity, now);
        }

        Optional<Boolean> checkpointGate = acquireCheckpointGate(identity);
        if (checkpointGate.isEmpty()) {
            checkpointLastSeen(identity, now);
        } else if (checkpointGate.get()) {
            checkpointLastSeenWithGateReleaseOnFailure(identity, now);
        }

        return heartbeatResponse(identity, now);
    }

    private Optional<RacePlayer> findExpiredRacePlayer(
            RacePlayerSessionIdentity identity,
            Optional<LocalDateTime> lastHeartbeatAt,
            LocalDateTime now
    ) {
        if (lastHeartbeatAt.isPresent()
                && reconnectPolicy.isActivityReferenceInsideGrace(
                        lastHeartbeatAt.get(),
                        now
                )) {
            return Optional.empty();
        }

        RacePlayer racePlayer = sessionLockService.lock(identity);
        Race race = racePlayer.getRace();

        if (race == null
                || race.getStatus() != RaceStatus.IN_PROGRESS
                || racePlayer.getStatus() != RacePlayerStatus.RACING) {
            return Optional.empty();
        }

        boolean expired = reconnectPolicy.isReconnectWindowExpired(
                lastHeartbeatAt,
                racePlayer.getLastSeenAt(),
                race.getStartedAt(),
                now
        );
        return expired ? Optional.of(racePlayer) : Optional.empty();
    }

    private boolean refreshHeartbeat(
            RacePlayerSessionIdentity identity,
            Instant nowInstant
    ) {
        try {
            redisPresenceService.markOnline(
                    identity.raceId(),
                    identity.racePlayerId(),
                    nowInstant
            );
            return true;
        } catch (DataAccessException exception) {
            logRedisFailure(
                    RacePlayerRuntimeLogMessages.REFRESH_HEARTBEAT,
                    identity,
                    exception
            );
            return false;
        }
    }

    private Optional<Boolean> acquireCheckpointGate(RacePlayerSessionIdentity identity) {
        try {
            return Optional.of(redisPresenceService.tryAcquireLastSeenDbSyncGate(
                    identity.raceId(),
                    identity.racePlayerId()
            ));
        } catch (DataAccessException exception) {
            logRedisFailure(
                    RacePlayerRuntimeLogMessages.ACQUIRE_CHECKPOINT_GATE,
                    identity,
                    exception
            );
            return Optional.empty();
        }
    }

    private void checkpointLastSeenWithGateReleaseOnFailure(
            RacePlayerSessionIdentity identity,
            LocalDateTime now
    ) {
        try {
            checkpointLastSeen(identity, now);
        } catch (DataAccessException exception) {
            try {
                redisPresenceService.releaseLastSeenDbSyncGate(
                        identity.raceId(),
                        identity.racePlayerId()
                );
            } catch (DataAccessException releaseException) {
                exception.addSuppressed(releaseException);
                logRedisFailure(
                        RacePlayerRuntimeLogMessages.RELEASE_CHECKPOINT_GATE,
                        identity,
                        releaseException
                );
            }
            throw exception;
        }
    }

    private RedisHeartbeatLookup readRedisHeartbeat(
            Long raceId,
            Long racePlayerId,
            String operation
    ) {
        try {
            return RedisHeartbeatLookup.available(
                    redisPresenceService.isOnline(raceId, racePlayerId),
                    redisPresenceService.findLastHeartbeatAt(raceId, racePlayerId)
                            .map(heartbeatInstant -> DateTimeUtils.toLocalDateTime(
                                    heartbeatInstant,
                                    clock.getZone()
                            ))
            );
        } catch (DataAccessException exception) {
            LOGGER.warn(
                    RacePlayerRuntimeLogMessages.REDIS_DURABLE_FALLBACK,
                    operation,
                    raceId,
                    racePlayerId,
                    exception
            );
            return RedisHeartbeatLookup.unavailable();
        }
    }

    private void checkpointLastSeen(
            RacePlayerSessionIdentity identity,
            LocalDateTime now
    ) {
        racePlayerRepository.updateLastSeenAtIfOlder(
                identity.racePlayerId(),
                identity.raceId(),
                now
        );
    }

    private RacePlayerHeartbeatResponse heartbeatResponse(
            RacePlayerSessionIdentity identity,
            LocalDateTime now
    ) {
        return new RacePlayerHeartbeatResponse(
                identity.raceId(),
                identity.racePlayerId(),
                now
        );
    }

    private void logRedisFailure(
            String operation,
            RacePlayerSessionIdentity identity,
            DataAccessException exception
    ) {
        LOGGER.warn(
                RacePlayerRuntimeLogMessages.REDIS_DURABLE_FALLBACK,
                operation,
                identity.raceId(),
                identity.racePlayerId(),
                exception
        );
    }

    private record RedisHeartbeatLookup(
            boolean available,
            boolean online,
            Optional<LocalDateTime> lastHeartbeatAt
    ) {

        private static RedisHeartbeatLookup available(
                boolean online,
                Optional<LocalDateTime> lastHeartbeatAt
        ) {
            return new RedisHeartbeatLookup(
                    true,
                    online,
                    Objects.requireNonNull(lastHeartbeatAt)
            );
        }

        private static RedisHeartbeatLookup unavailable() {
            return new RedisHeartbeatLookup(false, true, Optional.empty());
        }
    }
}
