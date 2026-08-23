package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Objects;

@Service
public class RacePlayerDisconnectService {

    private final RacePlayerRepository racePlayerRepository;
    private final RacePlayerGameplayPresenceService gameplayPresenceService;
    private final RacePlayerGameplayTimelineService gameplayTimelineService;

    public RacePlayerDisconnectService(
            RacePlayerRepository racePlayerRepository,
            RacePlayerGameplayPresenceService gameplayPresenceService,
            RacePlayerGameplayTimelineService gameplayTimelineService
    ) {
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.gameplayPresenceService = Objects.requireNonNull(gameplayPresenceService);
        this.gameplayTimelineService = Objects.requireNonNull(gameplayTimelineService);
    }

    public void disconnectForBackgroundExpiry(
            RacePlayer racePlayer,
            Instant decisionInstant
    ) {
        disconnect(racePlayer, decisionInstant, false);
    }

    public void disconnectForPlayerActivity(
            RacePlayer racePlayer,
            Instant decisionInstant
    ) {
        disconnect(racePlayer, decisionInstant, true);
    }

    private void disconnect(
            RacePlayer racePlayer,
            Instant decisionInstant,
            boolean playerActivity
    ) {
        if (racePlayer.getStatus() == RacePlayerStatus.DISCONNECTED) {
            gameplayPresenceService.markOffline(racePlayer);
            return;
        }

        if (racePlayer.getStatus() != RacePlayerStatus.FINISHED) {
            RacePlayerGameplayPresenceService.GameplayPresenceDecision presenceDecision =
                    gameplayPresenceService.resolve(racePlayer, decisionInstant);

            if (playerActivity) {
                gameplayTimelineService.settleGameplayRequest(
                        racePlayer,
                        decisionInstant,
                        presenceDecision
                );
            } else {
                gameplayTimelineService.settleBackground(
                        racePlayer,
                        decisionInstant,
                        presenceDecision
                );
            }

            if (racePlayer.getStatus() != RacePlayerStatus.FINISHED) {
                if (playerActivity) {
                    gameplayPresenceService.recordGameplayActivity(
                            racePlayer,
                            decisionInstant
                    );
                }

                racePlayer.setStatus(RacePlayerStatus.DISCONNECTED);
                racePlayerRepository.save(racePlayer);
            }
        }

        gameplayPresenceService.markOffline(racePlayer);
    }
}
