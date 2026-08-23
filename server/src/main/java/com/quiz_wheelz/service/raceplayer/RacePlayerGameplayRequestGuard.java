package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;

@Service
public class RacePlayerGameplayRequestGuard {

    private final RacePlayerGameplayPresenceService gameplayPresenceService;
    private final RacePlayerGameplayTimelineService gameplayTimelineService;
    private final RacePlayerRepository racePlayerRepository;

    public RacePlayerGameplayRequestGuard(
            RacePlayerGameplayPresenceService gameplayPresenceService,
            RacePlayerGameplayTimelineService gameplayTimelineService,
            RacePlayerRepository racePlayerRepository
    ) {
        this.gameplayPresenceService = Objects.requireNonNull(gameplayPresenceService);
        this.gameplayTimelineService = Objects.requireNonNull(gameplayTimelineService);
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
    }

    public void requireGameplayAccess(
            RacePlayer lockedRacePlayer,
            Instant decisionInstant
    ) {
        if (!requiresGameplayPresence(lockedRacePlayer)) {
            return;
        }

        RacePlayerGameplayPresenceService.GameplayPresenceDecision presenceDecision =
                gameplayPresenceService.resolve(lockedRacePlayer, decisionInstant);
        boolean disconnected = gameplayTimelineService.settleGameplayRequest(
                lockedRacePlayer,
                decisionInstant,
                presenceDecision
        );

        if (!disconnected && !requiresGameplayPresence(lockedRacePlayer)) {
            gameplayPresenceService.markOffline(lockedRacePlayer);
            return;
        }

        if (!presenceDecision.redisAvailable()) {
            gameplayPresenceService.recordGameplayActivity(
                    lockedRacePlayer,
                    decisionInstant
            );
            return;
        }

        if (presenceDecision.graceExpired()) {
            if (disconnected) {
                racePlayerRepository.save(lockedRacePlayer);
            }
            gameplayPresenceService.markOffline(lockedRacePlayer);
            throw new ApiException(ErrorCode.RACE_PLAYER_RECONNECT_WINDOW_EXPIRED);
        }

        if (!presenceDecision.online()) {
            throw new ApiException(ErrorCode.RACE_PLAYER_RECONNECT_REQUIRED);
        }

        gameplayPresenceService.recordGameplayActivity(
                lockedRacePlayer,
                decisionInstant
        );
    }

    private boolean requiresGameplayPresence(RacePlayer racePlayer) {
        return racePlayer.getStatus() == RacePlayerStatus.RACING
                && racePlayer.getRace() != null
                && racePlayer.getRace().getStatus() == RaceStatus.IN_PROGRESS;
    }
}
