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
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.PlayerLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.RaceLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationGate;
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
    private final RaceLiveEventChangeRecorder liveEventChangeRecorder;
    private final RaceLiveMutationGate liveMutationGate;
    private final Clock clock;

    public RacePlayerHeartbeatService(
            RacePlayerSessionLockService sessionLockService,
            RacePlayerRepository racePlayerRepository,
            RedisPresenceService redisPresenceService,
            RacePlayerReconnectPolicy reconnectPolicy,
            RacePlayerGameplayPresenceService gameplayPresenceService,
            RacePlayerGameplayTimelineService gameplayTimelineService,
            RacePlayerDisconnectService disconnectService,
            RaceLiveEventChangeRecorder liveEventChangeRecorder,
            RaceLiveMutationGate liveMutationGate,
            Clock clock
    ) {
        this.sessionLockService = Objects.requireNonNull(sessionLockService);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.redisPresenceService = Objects.requireNonNull(redisPresenceService);
        this.reconnectPolicy = Objects.requireNonNull(reconnectPolicy);
        this.gameplayPresenceService = Objects.requireNonNull(gameplayPresenceService);
        this.gameplayTimelineService = Objects.requireNonNull(gameplayTimelineService);
        this.disconnectService = Objects.requireNonNull(disconnectService);
        this.liveEventChangeRecorder = Objects.requireNonNull(liveEventChangeRecorder);
        this.liveMutationGate = Objects.requireNonNull(liveMutationGate);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional(noRollbackFor = ApiException.class)
    public RacePlayerHeartbeatResponse heartbeat(HttpServletRequest request) {
        RacePlayerSessionIdentity identity = sessionLockService.resolveIdentity(request);
        Instant decisionInstant = clock.instant();
        LocalDateTime decisionNow = DateTimeUtils.toLocalDateTime(
                decisionInstant,
                clock.getZone()
        );
        GameplayActivityLookup activityLookup = readGameplayActivity(identity);

        if (canRenewPresenceWithoutDurableLock(activityLookup, decisionNow)) {
            PresenceLeaseRenewal renewal = renewExistingPresenceLease(
                    identity,
                    decisionInstant
            );
            if (renewal == PresenceLeaseRenewal.RENEWED) {
                checkpointThroughGate(identity, decisionNow);
                return heartbeatResponse(identity, decisionNow);
            }
            activityLookup = activityLookup.withOnline(false);
        }

        return heartbeatWithDurableLock(
                identity,
                activityLookup,
                decisionInstant,
                decisionNow
        );
    }

    private RacePlayerHeartbeatResponse heartbeatWithDurableLock(
            RacePlayerSessionIdentity identity,
            GameplayActivityLookup activityLookup,
            Instant decisionInstant,
            LocalDateTime decisionNow
    ) {
        RacePlayer racePlayer = sessionLockService.lock(identity);
        Race activeRace = liveMutationGate.lockIfActive(racePlayer).orElse(null);
        PlayerLiveState playerBefore = activeRace == null
                ? null
                : liveEventChangeRecorder.capturePlayer(racePlayer);
        RaceLiveState raceBefore = activeRace == null
                ? null
                : liveEventChangeRecorder.captureRace(activeRace);

        try {
            return resolveHeartbeatWithDurableLock(
                    identity,
                    activityLookup,
                    decisionInstant,
                    decisionNow,
                    racePlayer
            );
        } finally {
            if (activeRace != null) {
                liveEventChangeRecorder.recordPlayerChange(playerBefore, racePlayer);
                liveEventChangeRecorder.recordRaceChange(raceBefore, activeRace);
            }
        }
    }

    private RacePlayerHeartbeatResponse resolveHeartbeatWithDurableLock(
            RacePlayerSessionIdentity identity,
            GameplayActivityLookup activityLookup,
            Instant decisionInstant,
            LocalDateTime decisionNow,
            RacePlayer racePlayer
    ) {
        validateHeartbeatAllowed(racePlayer);

        if (isReconnectWindowExpired(
                racePlayer,
                activityLookup.lastGameplayActivityAt(),
                decisionNow
        )) {
            disconnectService.disconnectForBackgroundExpiry(racePlayer, decisionInstant);
            throw new ApiException(ErrorCode.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED);
        }

        if (!activityLookup.available()) {
            checkpointLastSeen(identity, decisionNow);
            return heartbeatResponse(identity, decisionNow);
        }

        RacePlayerGameplayPresenceService.GameplayPresenceDecision presenceDecision =
                gameplayPresenceService.resolve(racePlayer, decisionInstant);
        boolean disconnected = gameplayTimelineService.settleGameplayRequest(
                racePlayer,
                decisionInstant,
                presenceDecision
        );

        if (disconnected) {
            gameplayPresenceService.markOffline(racePlayer);
            throw new ApiException(ErrorCode.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED);
        }

        if (!presenceDecision.online()) {
            throw new ApiException(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED);
        }

        gameplayPresenceService.renewPresenceLease(racePlayer, decisionInstant);

        if (activityLookup.online()) {
            checkpointThroughGate(identity, decisionNow);
        }

        return heartbeatResponse(identity, decisionNow);
    }

    private void validateHeartbeatAllowed(RacePlayer racePlayer) {
        Race race = racePlayer.getRace();
        RacePlayerStatus playerStatus = racePlayer.getStatus();
        RaceStatus raceStatus = race == null ? null : race.getStatus();

        boolean waiting = playerStatus == RacePlayerStatus.WAITING
                && (raceStatus == RaceStatus.WAITING_FOR_PLAYERS
                || raceStatus == RaceStatus.READY);
        boolean racing = playerStatus == RacePlayerStatus.RACING
                && raceStatus == RaceStatus.IN_PROGRESS;

        if (waiting || racing) {
            return;
        }

        gameplayPresenceService.markOffline(racePlayer);

        if (playerStatus == RacePlayerStatus.DISCONNECTED) {
            throw new ApiException(ErrorCode.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED);
        }
        if (raceStatus != RaceStatus.WAITING_FOR_PLAYERS
                && raceStatus != RaceStatus.READY
                && raceStatus != RaceStatus.IN_PROGRESS) {
            throw new ApiException(ErrorCode.RACE_NOT_IN_PROGRESS);
        }
        throw new ApiException(ErrorCode.RACE_PLAYER_NOT_RACING);
    }

    private boolean canRenewPresenceWithoutDurableLock(
            GameplayActivityLookup activityLookup,
            LocalDateTime decisionNow
    ) {
        return activityLookup.available()
                && activityLookup.online()
                && activityLookup.lastGameplayActivityAt().isPresent()
                && reconnectPolicy.isActivityReferenceInsideGrace(
                        activityLookup.lastGameplayActivityAt().get(),
                        decisionNow
                );
    }

    private boolean isReconnectWindowExpired(
            RacePlayer racePlayer,
            Optional<LocalDateTime> lastGameplayActivityAt,
            LocalDateTime decisionNow
    ) {
        Race race = racePlayer.getRace();
        if (race == null
                || race.getStatus() != RaceStatus.IN_PROGRESS
                || racePlayer.getStatus() != RacePlayerStatus.RACING) {
            return false;
        }

        return reconnectPolicy.isReconnectWindowExpired(
                lastGameplayActivityAt,
                racePlayer.getLastSeenAt(),
                race.getStartedAt(),
                decisionNow
        );
    }

    private GameplayActivityLookup readGameplayActivity(
            RacePlayerSessionIdentity identity
    ) {
        try {
            return GameplayActivityLookup.available(
                    redisPresenceService.isOnline(
                            identity.raceId(),
                            identity.racePlayerId()
                    ),
                    redisPresenceService.findLastGameplayActivityAt(
                                    identity.raceId(),
                                    identity.racePlayerId()
                            )
                            .map(activity -> DateTimeUtils.toLocalDateTime(
                                    activity,
                                    clock.getZone()
                            ))
            );
        } catch (DataAccessException exception) {
            logRedisFailure(
                    RacePlayerRuntimeLogMessages.READ_GAMEPLAY_ACTIVITY,
                    identity,
                    exception
            );
            return GameplayActivityLookup.unavailable();
        }
    }

    private PresenceLeaseRenewal renewExistingPresenceLease(
            RacePlayerSessionIdentity identity,
            Instant decisionInstant
    ) {
        try {
            boolean refreshed = redisPresenceService.renewExistingPresenceLease(
                    identity.raceId(),
                    identity.racePlayerId(),
                    decisionInstant
            );
            return refreshed
                    ? PresenceLeaseRenewal.RENEWED
                    : PresenceLeaseRenewal.MISSING;
        } catch (DataAccessException exception) {
            logRedisFailure(
                    RacePlayerRuntimeLogMessages.RENEW_PRESENCE_LEASE,
                    identity,
                    exception
            );
            return PresenceLeaseRenewal.UNAVAILABLE;
        }
    }

    private void checkpointThroughGate(
            RacePlayerSessionIdentity identity,
            LocalDateTime decisionNow
    ) {
        Optional<Boolean> checkpointGate = acquireCheckpointGate(identity);
        if (checkpointGate.isEmpty()) {
            checkpointLastSeen(identity, decisionNow);
        } else if (checkpointGate.get()) {
            checkpointLastSeenWithGateReleaseOnFailure(identity, decisionNow);
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
            LocalDateTime decisionNow
    ) {
        try {
            checkpointLastSeen(identity, decisionNow);
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

    private void checkpointLastSeen(
            RacePlayerSessionIdentity identity,
            LocalDateTime decisionNow
    ) {
        racePlayerRepository.updateLastSeenAtIfOlder(
                identity.racePlayerId(),
                identity.raceId(),
                decisionNow
        );
    }

    private RacePlayerHeartbeatResponse heartbeatResponse(
            RacePlayerSessionIdentity identity,
            LocalDateTime decisionNow
    ) {
        return new RacePlayerHeartbeatResponse(
                identity.raceId(),
                identity.racePlayerId(),
                decisionNow
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

    private enum PresenceLeaseRenewal {
        RENEWED,
        MISSING,
        UNAVAILABLE
    }

    private record GameplayActivityLookup(
            boolean available,
            boolean online,
            Optional<LocalDateTime> lastGameplayActivityAt
    ) {

        private static GameplayActivityLookup available(
                boolean online,
                Optional<LocalDateTime> lastGameplayActivityAt
        ) {
            return new GameplayActivityLookup(
                    true,
                    online,
                    Objects.requireNonNull(lastGameplayActivityAt)
            );
        }

        private static GameplayActivityLookup unavailable() {
            return new GameplayActivityLookup(false, true, Optional.empty());
        }

        private GameplayActivityLookup withOnline(boolean nextOnline) {
            return new GameplayActivityLookup(
                    available,
                    nextOnline,
                    lastGameplayActivityAt
            );
        }
    }
}
