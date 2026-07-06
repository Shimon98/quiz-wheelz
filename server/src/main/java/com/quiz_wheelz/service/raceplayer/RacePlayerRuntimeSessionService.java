package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerHeartbeatResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerLeaveResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerSessionIdentity;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
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

@Service
public class RacePlayerRuntimeSessionService {

    private final CurrentRacePlayerService currentRacePlayerService;
    private final RacePlayerRepository racePlayerRepository;
    private final RedisPresenceService redisPresenceService;
    private final Clock clock;

    @Autowired
    public RacePlayerRuntimeSessionService(
            CurrentRacePlayerService currentRacePlayerService,
            RacePlayerRepository racePlayerRepository,
            RedisPresenceService redisPresenceService
    ) {
        this(
                currentRacePlayerService,
                racePlayerRepository,
                redisPresenceService,
                Clock.systemDefaultZone()
        );
    }

    RacePlayerRuntimeSessionService(
            CurrentRacePlayerService currentRacePlayerService,
            RacePlayerRepository racePlayerRepository,
            RedisPresenceService redisPresenceService,
            Clock clock
    ) {
        this.currentRacePlayerService = Objects.requireNonNull(currentRacePlayerService);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.redisPresenceService = Objects.requireNonNull(redisPresenceService);
        this.clock = Objects.requireNonNull(clock);
    }

    public RacePlayerHeartbeatResponse heartbeat(HttpServletRequest request) {
        RacePlayerSessionIdentity identity =
                currentRacePlayerService.resolveCurrentRacePlayerIdentity(request);
        validateIdentity(identity);

        LocalDateTime now = LocalDateTime.now(clock);

        redisPresenceService.markOnline(
                identity.raceId(),
                identity.racePlayerId()
        );

        return new RacePlayerHeartbeatResponse(
                identity.raceId(),
                identity.racePlayerId(),
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

        redisPresenceService.markOffline(
                race.getId(),
                racePlayer.getId()
        );

        if (racePlayer.getStatus() != RacePlayerStatus.FINISHED) {
            racePlayer.setStatus(RacePlayerStatus.DISCONNECTED);
            racePlayer.setLastSeenAt(now);
            racePlayerRepository.save(racePlayer);
        }

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

        return racePlayerRepository
                .findLockedByIdAndRaceId(
                        racePlayer.getId(),
                        racePlayer.getRace().getId()
                )
                .orElseThrow(() -> new ApiException(ErrorCode.RACE_PLAYER_NOT_FOUND));
    }
}
