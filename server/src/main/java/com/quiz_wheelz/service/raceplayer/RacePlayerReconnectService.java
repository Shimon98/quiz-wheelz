package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceplayer.RacePlayerReconnectResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerReconnectOutcome;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationContext;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationTracker;
import com.quiz_wheelz.utils.DateTimeUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Objects;

@Service
public class RacePlayerReconnectService {

    private final RacePlayerSessionLockService sessionLockService;
    private final RacePlayerGameplayPresenceService gameplayPresenceService;
    private final RacePlayerGameplayTimelineService gameplayTimelineService;
    private final RacePlayerDisconnectService disconnectService;
    private final RaceLiveMutationTracker liveMutationTracker;
    private final Clock clock;

    public RacePlayerReconnectService(
            RacePlayerSessionLockService sessionLockService,
            RacePlayerGameplayPresenceService gameplayPresenceService,
            RacePlayerGameplayTimelineService gameplayTimelineService,
            RacePlayerDisconnectService disconnectService,
            RaceLiveMutationTracker liveMutationTracker,
            Clock clock
    ) {
        this.sessionLockService = Objects.requireNonNull(sessionLockService);
        this.gameplayPresenceService = Objects.requireNonNull(gameplayPresenceService);
        this.gameplayTimelineService = Objects.requireNonNull(gameplayTimelineService);
        this.disconnectService = Objects.requireNonNull(disconnectService);
        this.liveMutationTracker = Objects.requireNonNull(liveMutationTracker);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional
    public RacePlayerReconnectResponse reconnect(HttpServletRequest request) {
        RacePlayer racePlayer = sessionLockService.resolveAndLock(request);
        RaceLiveMutationContext liveContext = liveMutationTracker.begin(racePlayer);

        try {
            return resolveReconnect(racePlayer);
        } finally {
            liveMutationTracker.recordChanges(liveContext, racePlayer);
        }
    }

    private RacePlayerReconnectResponse resolveReconnect(RacePlayer racePlayer) {
        Race race = Objects.requireNonNull(racePlayer.getRace());
        Instant nowInstant = clock.instant();
        LocalDateTime now = DateTimeUtils.toLocalDateTime(nowInstant, clock.getZone());

        RacePlayerReconnectOutcome terminalOutcome = resolveTerminalOutcome(race, racePlayer);
        if (terminalOutcome != null) {
            gameplayPresenceService.markOffline(racePlayer);
            return buildResponse(race, racePlayer, terminalOutcome, false, false, now);
        }

        if (race.getStatus() != RaceStatus.IN_PROGRESS
                || racePlayer.getStatus() != RacePlayerStatus.RACING) {
            gameplayPresenceService.renewPresenceLease(racePlayer, nowInstant);
            return buildResponse(
                    race,
                    racePlayer,
                    resolveReconnectOutcome(race),
                    true,
                    false,
                    now
            );
        }

        RacePlayerGameplayPresenceService.GameplayPresenceDecision presenceDecision =
                gameplayPresenceService.resolve(racePlayer, nowInstant);

        if (presenceDecision.graceExpired()) {
            disconnectService.disconnectForBackgroundExpiry(racePlayer, nowInstant);
            return buildResponse(
                    race,
                    racePlayer,
                    RacePlayerReconnectOutcome.RECONNECT_WINDOW_EXPIRED,
                    false,
                    false,
                    now
            );
        }

        gameplayTimelineService.settleReconnect(
                racePlayer,
                nowInstant,
                presenceDecision
        );

        if (racePlayer.getStatus() == RacePlayerStatus.FINISHED) {
            gameplayPresenceService.markOffline(racePlayer);
            return buildResponse(
                    race,
                    racePlayer,
                    RacePlayerReconnectOutcome.PLAYER_FINISHED,
                    false,
                    false,
                    now
            );
        }

        gameplayPresenceService.renewPresenceLease(racePlayer, nowInstant);
        return buildResponse(
                race,
                racePlayer,
                resolveReconnectOutcome(race),
                true,
                canContinueRace(race, racePlayer),
                now
        );
    }

    private RacePlayerReconnectOutcome resolveTerminalOutcome(
            Race race,
            RacePlayer racePlayer
    ) {
        if (race.getStatus() == RaceStatus.FINISHED) {
            return RacePlayerReconnectOutcome.RACE_FINISHED;
        }
        if (racePlayer.getStatus() == RacePlayerStatus.FINISHED) {
            return RacePlayerReconnectOutcome.PLAYER_FINISHED;
        }
        if (racePlayer.getStatus() == RacePlayerStatus.DISCONNECTED) {
            return RacePlayerReconnectOutcome.ALREADY_DISCONNECTED;
        }
        return null;
    }

    private RacePlayerReconnectOutcome resolveReconnectOutcome(Race race) {
        return race.getStatus() == RaceStatus.IN_PROGRESS
                ? RacePlayerReconnectOutcome.RECONNECTED
                : RacePlayerReconnectOutcome.WAITING_FOR_RACE;
    }

    private boolean canContinueRace(Race race, RacePlayer racePlayer) {
        return race.getStatus() == RaceStatus.IN_PROGRESS
                && racePlayer.getStatus() == RacePlayerStatus.RACING;
    }

    private RacePlayerReconnectResponse buildResponse(
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
