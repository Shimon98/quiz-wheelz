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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;

@Service
public class RacePlayerRuntimeSessionService {

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

    @Transactional
    public RacePlayerHeartbeatResponse heartbeat(HttpServletRequest request) {
        RacePlayerSessionIdentity identity =
                currentRacePlayerService.resolveCurrentRacePlayerIdentity(request);
        validateIdentity(identity);

        LocalDateTime now = LocalDateTime.now(clock);

        Optional<RacePlayer> expiredRacePlayer =
                findRacePlayerIfReconnectWindowExpired(identity, now);

        if (expiredRacePlayer.isPresent()) {
            RacePlayer racePlayer = expiredRacePlayer.get();

            markOfflineAndDisconnectIfNeeded(
                    racePlayer.getRace(),
                    racePlayer,
                    now
            );

            throw new ApiException(ErrorCode.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED);
        }

        redisPresenceService.markOnline(
                identity.raceId(),
                identity.racePlayerId(),
                now
        );

        return new RacePlayerHeartbeatResponse(
                identity.raceId(),
                identity.racePlayerId(),
                now
        );
    }

    @Transactional
    public RacePlayerReconnectResponse reconnect(HttpServletRequest request) {
        RacePlayer sessionRacePlayer =
                currentRacePlayerService.resolveCurrentRacePlayerSession(request);

        RacePlayer racePlayer = findLockedRacePlayer(sessionRacePlayer);
        Race race = Objects.requireNonNull(racePlayer.getRace());
        LocalDateTime now = LocalDateTime.now(clock);

        if (race.getStatus() == RaceStatus.FINISHED) {
            redisPresenceService.markOffline(race.getId(), racePlayer.getId());

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
            redisPresenceService.markOffline(race.getId(), racePlayer.getId());

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
            redisPresenceService.markOffline(race.getId(), racePlayer.getId());

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

        redisPresenceService.markOnline(race.getId(), racePlayer.getId(), now);

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
            LocalDateTime now
    ) {
        Optional<LocalDateTime> lastHeartbeatAt =
                redisPresenceService.findLastHeartbeatAt(
                        identity.raceId(),
                        identity.racePlayerId()
                );

        if (lastHeartbeatAt.isEmpty()) {
            return Optional.empty();
        }

        if (racePlayerReconnectPolicy.isActivityReferenceInsideGrace(
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

        return isReconnectWindowExpired(
                race,
                racePlayer,
                redisPresenceService.findLastHeartbeatAt(
                        race.getId(),
                        racePlayer.getId()
                ),
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
                race.getStartedAt(),
                now
        );
    }

    private boolean cannotReconnectWindowExpire(
            Race race,
            RacePlayer racePlayer
    ) {
        return race == null
                || race.getStatus() != RaceStatus.IN_PROGRESS
                || racePlayer.getStatus() != RacePlayerStatus.RACING;
    }

    private void markOfflineAndDisconnectIfNeeded(
            Race race,
            RacePlayer racePlayer,
            LocalDateTime now
    ) {
        disconnectRacePlayerIfNotFinished(racePlayer, now);

        redisPresenceService.markOffline(
                race.getId(),
                racePlayer.getId()
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
        racePlayer.setLastSeenAt(now);
        racePlayerRepository.save(racePlayer);
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
}
