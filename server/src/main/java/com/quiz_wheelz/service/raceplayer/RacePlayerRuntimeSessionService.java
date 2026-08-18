package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerHeartbeatResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerLeaveResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerReconnectResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerReconnectOutcome;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.exception.ErrorMessages;
import com.quiz_wheelz.repository.RacePlayerRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Service
public class RacePlayerRuntimeSessionService {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(RacePlayerRuntimeSessionService.class);

    private final CurrentRacePlayerService currentRacePlayerService;
    private final RacePlayerRepository racePlayerRepository;
    private final RedisPresenceService redisPresenceService;
    private final RacePlayerReconnectPolicy racePlayerReconnectPolicy;
    private final Clock clock;

    @Autowired
    public RacePlayerRuntimeSessionService(
            CurrentRacePlayerService currentRacePlayerService,
            RacePlayerRepository racePlayerRepository,
            RedisPresenceService redisPresenceService,
            RacePlayerReconnectPolicy racePlayerReconnectPolicy
    ) {
        this(
                currentRacePlayerService,
                racePlayerRepository,
                redisPresenceService,
                racePlayerReconnectPolicy,
                Clock.systemDefaultZone()
        );
    }

    RacePlayerRuntimeSessionService(
            CurrentRacePlayerService currentRacePlayerService,
            RacePlayerRepository racePlayerRepository,
            RedisPresenceService redisPresenceService,
            RacePlayerReconnectPolicy racePlayerReconnectPolicy,
            Clock clock
    ) {
        this.currentRacePlayerService = Objects.requireNonNull(currentRacePlayerService);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.redisPresenceService = Objects.requireNonNull(redisPresenceService);
        this.racePlayerReconnectPolicy = Objects.requireNonNull(racePlayerReconnectPolicy);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public RacePlayerHeartbeatResponse heartbeat(HttpServletRequest request) {
        RacePlayerSessionIdentity identity =
                currentRacePlayerService.resolveCurrentRacePlayerIdentity(request);
        validateIdentity(identity);

        LocalDateTime now = LocalDateTime.now(clock);

        RedisHeartbeatLookup redisHeartbeatLookup = readRedisHeartbeat(
                identity.raceId(),
                identity.racePlayerId(),
                "read heartbeat"
        );

        Optional<RacePlayer> expiredRacePlayer = findRacePlayerIfReconnectWindowExpired(
                identity,
                redisHeartbeatLookup.lastHeartbeatAt(),
                now
        );

        if (expiredRacePlayer.isPresent()) {
            RacePlayer racePlayer = expiredRacePlayer.get();

            markOfflineAndDisconnectIfNeeded(
                    racePlayer.getRace(),
                    racePlayer,
                    now
            );

            throw new ApiException(ErrorCode.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED);
        }

        if (redisHeartbeatLookup.available()) {
            try {
                redisPresenceService.markOnline(
                        identity.raceId(),
                        identity.racePlayerId(),
                        now
                );
            } catch (DataAccessException exception) {
                logRedisFailure("refresh heartbeat", identity.raceId(), identity.racePlayerId(), exception);
                checkpointLastSeen(identity, now);
                return heartbeatResponse(identity, now);
            }

            boolean checkpointGateAcquired;
            try {
                checkpointGateAcquired = redisPresenceService.tryAcquireLastSeenDbSyncGate(
                        identity.raceId(),
                        identity.racePlayerId()
                );
            } catch (DataAccessException exception) {
                logRedisFailure("acquire checkpoint gate", identity.raceId(), identity.racePlayerId(), exception);
                checkpointLastSeen(identity, now);
                return heartbeatResponse(identity, now);
            }

            if (checkpointGateAcquired) {
                checkpointLastSeenWithGateReleaseOnFailure(identity, now);
            }
        } else {
            checkpointLastSeen(identity, now);
        }

        return heartbeatResponse(identity, now);
    }

    @Transactional
    public RacePlayerReconnectResponse reconnect(HttpServletRequest request) {
        RacePlayer sessionRacePlayer =
                currentRacePlayerService.resolveCurrentRacePlayerSession(request);

        RacePlayer racePlayer = findLockedRacePlayer(sessionRacePlayer);
        Race race = Objects.requireNonNull(racePlayer.getRace());
        LocalDateTime now = LocalDateTime.now(clock);

        if (race.getStatus() == RaceStatus.FINISHED) {
            markOfflineIgnoringRedisOutage(race.getId(), racePlayer.getId());

            return buildReconnectResponse(
                    race,
                    racePlayer,
                    RacePlayerReconnectOutcome.RACE_FINISHED,
                    false,
                    false,
                    now
            );
        }

        if (racePlayer.getStatus() == RacePlayerStatus.FINISHED) {
            markOfflineIgnoringRedisOutage(race.getId(), racePlayer.getId());

            return buildReconnectResponse(
                    race,
                    racePlayer,
                    RacePlayerReconnectOutcome.PLAYER_FINISHED,
                    false,
                    false,
                    now
            );
        }

        if (racePlayer.getStatus() == RacePlayerStatus.DISCONNECTED) {
            markOfflineIgnoringRedisOutage(race.getId(), racePlayer.getId());

            return buildReconnectResponse(
                    race,
                    racePlayer,
                    RacePlayerReconnectOutcome.ALREADY_DISCONNECTED,
                    false,
                    false,
                    now
            );
        }

        if (isReconnectWindowExpired(race, racePlayer, now)) {
            markOfflineAndDisconnectIfNeeded(race, racePlayer, now);

            return buildReconnectResponse(
                    race,
                    racePlayer,
                    RacePlayerReconnectOutcome.RECONNECT_WINDOW_EXPIRED,
                    false,
                    false,
                    now
            );
        }

        advanceLastSeenAt(racePlayer, now);

        try {
            redisPresenceService.markOnline(race.getId(), racePlayer.getId(), now);
        } catch (DataAccessException exception) {
            logRedisFailure("refresh reconnect presence", race.getId(), racePlayer.getId(), exception);
        }

        RacePlayerReconnectOutcome outcome = resolveReconnectOutcome(race);
        boolean canContinueRace = canContinueRace(race, racePlayer);

        return buildReconnectResponse(
                race,
                racePlayer,
                outcome,
                true,
                canContinueRace,
                now
        );
    }

    @Transactional
    public RacePlayerLeaveResponse leave(HttpServletRequest request) {
        RacePlayer sessionRacePlayer =
                currentRacePlayerService.resolveCurrentRacePlayerSession(request);

        RacePlayer racePlayer = findLockedRacePlayer(sessionRacePlayer);
        Race race = Objects.requireNonNull(racePlayer.getRace());

        LocalDateTime now = LocalDateTime.now(clock);

        markOfflineAndDisconnectIfNeeded(race, racePlayer, now);

        return new RacePlayerLeaveResponse(
                racePlayer.getId(),
                now,
                racePlayer.getStatus()
        );
    }

    private void validateIdentity(RacePlayerSessionIdentity identity) {
        if (identity == null
                || identity.raceId() == null
                || identity.racePlayerId() == null) {
            throw new IllegalArgumentException(ErrorMessages.RACE_PLAYER_SESSION_IDENTITY_MISSING);
        }
    }

    private RacePlayer findLockedRacePlayer(RacePlayer racePlayer) {
        if (racePlayer == null
                || racePlayer.getId() == null
                || racePlayer.getRace() == null
                || racePlayer.getRace().getId() == null) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND);
        }

        return findLockedRacePlayer(
                racePlayer.getId(),
                racePlayer.getRace().getId()
        );
    }

    private RacePlayer findLockedRacePlayer(
            Long racePlayerId,
            Long raceId
    ) {
        if (racePlayerId == null || raceId == null) {
            throw new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND);
        }

        return racePlayerRepository
                .findLockedByIdAndRaceId(
                        racePlayerId,
                        raceId
                )
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND));
    }

    private Optional<RacePlayer> findRacePlayerIfReconnectWindowExpired(
            RacePlayerSessionIdentity identity,
            Optional<LocalDateTime> lastHeartbeatAt,
            LocalDateTime now
    ) {
        if (lastHeartbeatAt.isPresent()
                && racePlayerReconnectPolicy.isActivityReferenceInsideGrace(
                        lastHeartbeatAt.get(),
                        now
                )) {
            return Optional.empty();
        }

        RacePlayer racePlayer = findLockedRacePlayer(
                identity.racePlayerId(),
                identity.raceId()
        );

        if (!isReconnectWindowExpired(
                racePlayer.getRace(),
                racePlayer,
                lastHeartbeatAt,
                now
        )) {
            return Optional.empty();
        }

        return Optional.of(racePlayer);
    }

    private boolean isReconnectWindowExpired(
            Race race,
            RacePlayer racePlayer,
            LocalDateTime now
    ) {
        if (cannotReconnectWindowExpire(race, racePlayer)) {
            return false;
        }

        RedisHeartbeatLookup redisHeartbeatLookup = readRedisHeartbeat(
                race.getId(),
                racePlayer.getId(),
                "read reconnect heartbeat"
        );

        return isReconnectWindowExpired(
                race,
                racePlayer,
                redisHeartbeatLookup.lastHeartbeatAt(),
                now
        );
    }

    private boolean isReconnectWindowExpired(
            Race race,
            RacePlayer racePlayer,
            Optional<LocalDateTime> lastHeartbeatAt,
            LocalDateTime now
    ) {
        if (cannotReconnectWindowExpire(race, racePlayer)) {
            return false;
        }

        return racePlayerReconnectPolicy.isReconnectWindowExpired(
                lastHeartbeatAt,
                racePlayer.getLastSeenAt(),
                race.getStartedAt(),
                now
        );
    }

    private boolean cannotReconnectWindowExpire(
            Race race,
            RacePlayer racePlayer
    ) {
        return race == null
                || racePlayer == null
                || race.getStatus() != RaceStatus.IN_PROGRESS
                || racePlayer.getStatus() != RacePlayerStatus.RACING;
    }

    private void markOfflineAndDisconnectIfNeeded(
            Race race,
            RacePlayer racePlayer,
            LocalDateTime now
    ) {
        disconnectRacePlayerIfNotFinished(racePlayer, now);

        markOfflineIgnoringRedisOutage(race.getId(), racePlayer.getId());
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
                        "release failed checkpoint gate",
                        identity.raceId(),
                        identity.racePlayerId(),
                        releaseException
                );
            }

            throw exception;
        }
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

    private void markOfflineIgnoringRedisOutage(Long raceId, Long racePlayerId) {
        try {
            redisPresenceService.markOffline(raceId, racePlayerId);
        } catch (DataAccessException exception) {
            logRedisFailure("mark player offline", raceId, racePlayerId, exception);
        }
    }

    private RedisHeartbeatLookup readRedisHeartbeat(
            Long raceId,
            Long racePlayerId,
            String operation
    ) {
        try {
            return RedisHeartbeatLookup.available(
                    redisPresenceService.findLastHeartbeatAt(raceId, racePlayerId)
            );
        } catch (DataAccessException exception) {
            logRedisFailure(operation, raceId, racePlayerId, exception);
            return RedisHeartbeatLookup.unavailable();
        }
    }

    private void logRedisFailure(
            String operation,
            Long raceId,
            Long racePlayerId,
            DataAccessException exception
    ) {
        LOGGER.warn(
                "Unable to {} in Redis for raceId={} racePlayerId={}; using durable state",
                operation,
                raceId,
                racePlayerId,
                exception
        );
    }

    private void disconnectRacePlayerIfNotFinished(
            RacePlayer racePlayer,
            LocalDateTime now
    ) {
        if (racePlayer.getStatus() == RacePlayerStatus.FINISHED) {
            return;
        }

        racePlayer.setStatus(RacePlayerStatus.DISCONNECTED);
        advanceLastSeenAt(racePlayer, now);
        racePlayerRepository.save(racePlayer);
    }

    private void advanceLastSeenAt(RacePlayer racePlayer, LocalDateTime activityAt) {
        if (racePlayer.getLastSeenAt() == null
                || racePlayer.getLastSeenAt().isBefore(activityAt)) {
            racePlayer.setLastSeenAt(activityAt);
        }
    }

    private RacePlayerReconnectOutcome resolveReconnectOutcome(Race race) {
        if (race.getStatus() == RaceStatus.IN_PROGRESS) {
            return RacePlayerReconnectOutcome.RECONNECTED;
        }

        return RacePlayerReconnectOutcome.WAITING_FOR_RACE;
    }

    private boolean canContinueRace(
            Race race,
            RacePlayer racePlayer
    ) {
        return race.getStatus() == RaceStatus.IN_PROGRESS
                && racePlayer.getStatus() == RacePlayerStatus.RACING;
    }

    private RacePlayerReconnectResponse buildReconnectResponse(
            Race race,
            RacePlayer racePlayer,
            RacePlayerReconnectOutcome outcome,
            boolean online,
            boolean canContinueRace,
            LocalDateTime resolvedAt
    ) {
        return new RacePlayerReconnectResponse(
                race.getId(),
                racePlayer.getId(),
                outcome,
                online,
                canContinueRace,
                racePlayer.getStatus(),
                race.getStatus(),
                resolvedAt
        );
    }

    private record RedisHeartbeatLookup(
            boolean available,
            Optional<LocalDateTime> lastHeartbeatAt
    ) {

        private static RedisHeartbeatLookup available(
                Optional<LocalDateTime> lastHeartbeatAt
        ) {
            return new RedisHeartbeatLookup(
                    true,
                    Objects.requireNonNull(lastHeartbeatAt)
            );
        }

        private static RedisHeartbeatLookup unavailable() {
            return new RedisHeartbeatLookup(false, Optional.empty());
        }
    }
}
