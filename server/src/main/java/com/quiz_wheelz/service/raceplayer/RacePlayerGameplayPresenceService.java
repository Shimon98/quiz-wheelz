package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Service
public class RacePlayerGameplayPresenceService {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(RacePlayerGameplayPresenceService.class);

    private final RedisPresenceService redisPresenceService;
    private final RacePlayerRepository racePlayerRepository;
    private final RacePlayerReconnectPolicy reconnectPolicy;
    private final Clock clock;

    public RacePlayerGameplayPresenceService(
            RedisPresenceService redisPresenceService,
            RacePlayerRepository racePlayerRepository,
            RacePlayerReconnectPolicy reconnectPolicy,
            Clock clock
    ) {
        this.redisPresenceService = Objects.requireNonNull(redisPresenceService);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.reconnectPolicy = Objects.requireNonNull(reconnectPolicy);
        this.clock = Objects.requireNonNull(clock);
    }

    public GameplayPresenceDecision resolve(
            RacePlayer racePlayer,
            Instant decisionInstant
    ) {
        Objects.requireNonNull(racePlayer);
        Objects.requireNonNull(decisionInstant);

        Race race = Objects.requireNonNull(racePlayer.getRace());
        LocalDateTime decisionNow = DateTimeUtils.toLocalDateTime(
                decisionInstant,
                clock.getZone()
        );

        try {
            boolean online = redisPresenceService.isOnline(
                    race.getId(),
                    racePlayer.getId()
            );
            Optional<Instant> redisActivity =
                    redisPresenceService.findLastGameplayActivityAt(
                            race.getId(),
                            racePlayer.getId()
                    );
            Optional<LocalDateTime> redisActivityLocal = redisActivity.map(
                    activity -> DateTimeUtils.toLocalDateTime(activity, clock.getZone())
            );
            long movementCutoffEpochMs = resolveMovementCutoffEpochMs(
                    racePlayer,
                    decisionInstant,
                    redisActivityLocal.orElse(null)
            );
            boolean graceExpired = isGraceExpired(
                    race,
                    racePlayer,
                    redisActivityLocal,
                    decisionNow
            );

            return GameplayPresenceDecision.precise(
                    online,
                    graceExpired,
                    movementCutoffEpochMs
            );
        } catch (DataAccessException exception) {
            LOGGER.warn(
                    RacePlayerRuntimeLogMessages.RESOLVE_PRESENCE_FAILED,
                    race.getId(),
                    racePlayer.getId(),
                    exception
            );
            return GameplayPresenceDecision.degraded(decisionInstant.toEpochMilli());
        }
    }

    public long resolveUntrustedActivityCutoff(
            RacePlayer racePlayer,
            Instant decisionInstant
    ) {
        Objects.requireNonNull(racePlayer);
        Objects.requireNonNull(decisionInstant);

        Race race = Objects.requireNonNull(racePlayer.getRace());

        try {
            LocalDateTime redisActivity = redisPresenceService
                    .findLastGameplayActivityAt(race.getId(), racePlayer.getId())
                    .map(activity -> DateTimeUtils.toLocalDateTime(
                            activity,
                            clock.getZone()
                    ))
                    .orElse(null);

            return resolveMovementCutoffEpochMs(
                    racePlayer,
                    decisionInstant,
                    redisActivity
            );
        } catch (DataAccessException exception) {
            LOGGER.warn(
                    RacePlayerRuntimeLogMessages.RESOLVE_UNTRUSTED_CUTOFF_FAILED,
                    race.getId(),
                    racePlayer.getId(),
                    exception
            );
            return resolveMovementCutoffEpochMs(
                    racePlayer,
                    decisionInstant,
                    null
            );
        }
    }

    public void recordGameplayActivity(
            RacePlayer racePlayer,
            Instant activityInstant
    ) {
        Objects.requireNonNull(racePlayer);
        Objects.requireNonNull(activityInstant);

        Race race = Objects.requireNonNull(racePlayer.getRace());
        try {
            redisPresenceService.recordGameplayActivity(
                    race.getId(),
                    racePlayer.getId(),
                    activityInstant
            );
        } catch (DataAccessException exception) {
            recordDurableFallback(racePlayer, activityInstant);
            LOGGER.warn(
                    RacePlayerRuntimeLogMessages.RECORD_ACTIVITY_FAILED,
                    race.getId(),
                    racePlayer.getId(),
                    exception
            );
        }
    }

    public void renewPresenceLease(
            RacePlayer racePlayer,
            Instant activityInstant
    ) {
        Objects.requireNonNull(racePlayer);
        Objects.requireNonNull(activityInstant);

        Race race = Objects.requireNonNull(racePlayer.getRace());
        try {
            redisPresenceService.renewPresenceLease(
                    race.getId(),
                    racePlayer.getId(),
                    activityInstant
            );
        } catch (DataAccessException exception) {
            recordDurableFallback(racePlayer, activityInstant);
            LOGGER.warn(
                    RacePlayerRuntimeLogMessages.RENEW_PRESENCE_LEASE_FAILED,
                    race.getId(),
                    racePlayer.getId(),
                    exception
            );
        }
    }

    private void recordDurableFallback(
            RacePlayer racePlayer,
            Instant activityInstant
    ) {
        LocalDateTime activityAt = DateTimeUtils.toLocalDateTime(
                activityInstant,
                clock.getZone()
        );

        if (racePlayer.getLastSeenAt() == null
                || racePlayer.getLastSeenAt().isBefore(activityAt)) {
            racePlayer.setLastSeenAt(activityAt);
            racePlayerRepository.save(racePlayer);
        }
    }

    private long resolveMovementCutoffEpochMs(
            RacePlayer racePlayer,
            Instant decisionInstant,
            LocalDateTime redisActivity
    ) {
        Race race = Objects.requireNonNull(racePlayer.getRace());
        LocalDateTime latestActivity = reconnectPolicy.resolveLatestActivityReference(
                redisActivity,
                racePlayer.getLastSeenAt(),
                race.getStartedAt()
        );

        return latestActivity == null
                ? decisionInstant.toEpochMilli()
                : Math.min(
                        decisionInstant.toEpochMilli(),
                        DateTimeUtils.toEpochMilli(latestActivity, clock.getZone())
                );
    }

    public void markOffline(RacePlayer racePlayer) {
        Objects.requireNonNull(racePlayer);
        Race race = Objects.requireNonNull(racePlayer.getRace());

        try {
            redisPresenceService.markOffline(race.getId(), racePlayer.getId());
        } catch (DataAccessException exception) {
            LOGGER.warn(
                    RacePlayerRuntimeLogMessages.MARK_OFFLINE_FAILED,
                    race.getId(),
                    racePlayer.getId(),
                    exception
            );
        }
    }

    private boolean isGraceExpired(
            Race race,
            RacePlayer racePlayer,
            Optional<LocalDateTime> redisActivity,
            LocalDateTime decisionNow
    ) {
        if (race.getStatus() != RaceStatus.IN_PROGRESS
                || racePlayer.getStatus() != RacePlayerStatus.RACING) {
            return false;
        }

        return reconnectPolicy.isReconnectWindowExpired(
                redisActivity,
                racePlayer.getLastSeenAt(),
                race.getStartedAt(),
                decisionNow
        );
    }

    public record GameplayPresenceDecision(
            boolean redisAvailable,
            boolean online,
            boolean graceExpired,
            long movementCutoffEpochMs
    ) {

        private static GameplayPresenceDecision precise(
                boolean online,
                boolean graceExpired,
                long movementCutoffEpochMs
        ) {
            return new GameplayPresenceDecision(
                    true,
                    online,
                    graceExpired,
                    movementCutoffEpochMs
            );
        }

        private static GameplayPresenceDecision degraded(long decisionEpochMs) {
            return new GameplayPresenceDecision(
                    false,
                    true,
                    false,
                    decisionEpochMs
            );
        }

        public boolean requiresResume() {
            return redisAvailable && !online;
        }

        public boolean blocksRaceCompletion() {
            return !redisAvailable || online;
        }
    }
}
