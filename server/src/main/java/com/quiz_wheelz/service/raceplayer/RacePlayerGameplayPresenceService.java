package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
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
    private final RacePlayerReconnectPolicy reconnectPolicy;
    private final Clock clock;

    public RacePlayerGameplayPresenceService(
            RedisPresenceService redisPresenceService,
            RacePlayerReconnectPolicy reconnectPolicy,
            Clock clock
    ) {
        this.redisPresenceService = Objects.requireNonNull(redisPresenceService);
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
                    redisPresenceService.findLastHeartbeatAt(
                            race.getId(),
                            racePlayer.getId()
                    );
            Optional<LocalDateTime> redisActivityLocal = redisActivity.map(
                    activity -> DateTimeUtils.toLocalDateTime(activity, clock.getZone())
            );
            LocalDateTime latestActivity = reconnectPolicy.resolveLatestActivityReference(
                    redisActivityLocal.orElse(null),
                    racePlayer.getLastSeenAt(),
                    race.getStartedAt()
            );
            long movementCutoffEpochMs = latestActivity == null
                    ? decisionInstant.toEpochMilli()
                    : Math.min(
                            decisionInstant.toEpochMilli(),
                            DateTimeUtils.toEpochMilli(latestActivity, clock.getZone())
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

    public void recordPlayerActivity(
            RacePlayer racePlayer,
            Instant activityInstant
    ) {
        Objects.requireNonNull(racePlayer);
        Objects.requireNonNull(activityInstant);

        Race race = Objects.requireNonNull(racePlayer.getRace());
        LocalDateTime activityAt = DateTimeUtils.toLocalDateTime(
                activityInstant,
                clock.getZone()
        );

        if (racePlayer.getLastSeenAt() == null
                || racePlayer.getLastSeenAt().isBefore(activityAt)) {
            racePlayer.setLastSeenAt(activityAt);
        }

        try {
            redisPresenceService.markOnline(
                    race.getId(),
                    racePlayer.getId(),
                    activityInstant
            );
        } catch (DataAccessException exception) {
            LOGGER.warn(
                    RacePlayerRuntimeLogMessages.RECORD_ACTIVITY_FAILED,
                    race.getId(),
                    racePlayer.getId(),
                    exception
            );
        }
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
