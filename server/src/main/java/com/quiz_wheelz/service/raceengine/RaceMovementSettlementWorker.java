package com.quiz_wheelz.service.raceengine;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.PlayerChange;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.PlayerLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveEventChangeRecorder.RaceLiveState;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationContext;
import com.quiz_wheelz.service.liveevent.RaceLiveMutationTracker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class RaceMovementSettlementWorker {

    private final RacePlayerRepository racePlayerRepository;
    private final RaceRepository raceRepository;
    private final RacePlayerGameplayPresenceService gameplayPresenceService;
    private final RacePlayerGameplayTimelineService gameplayTimelineService;
    private final RaceFinishService raceFinishService;
    private final RaceLiveEventChangeRecorder liveEventChangeRecorder;
    private final RaceLiveMutationTracker liveMutationTracker;
    private final Clock clock;

    public RaceMovementSettlementWorker(
            RacePlayerRepository racePlayerRepository,
            RaceRepository raceRepository,
            RacePlayerGameplayPresenceService gameplayPresenceService,
            RacePlayerGameplayTimelineService gameplayTimelineService,
            RaceFinishService raceFinishService,
            RaceLiveEventChangeRecorder liveEventChangeRecorder,
            RaceLiveMutationTracker liveMutationTracker,
            Clock clock
    ) {
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.raceRepository = Objects.requireNonNull(raceRepository);
        this.gameplayPresenceService = Objects.requireNonNull(gameplayPresenceService);
        this.gameplayTimelineService = Objects.requireNonNull(gameplayTimelineService);
        this.raceFinishService = Objects.requireNonNull(raceFinishService);
        this.liveEventChangeRecorder = Objects.requireNonNull(liveEventChangeRecorder);
        this.liveMutationTracker = Objects.requireNonNull(liveMutationTracker);
        this.clock = Objects.requireNonNull(clock);
    }

    @Transactional
    public void settlePlayer(Long racePlayerId, Long raceId) {
        RacePlayer racePlayer = racePlayerRepository
                .findLockedByIdAndRaceId(racePlayerId, raceId)
                .orElse(null);

        if (racePlayer == null) {
            return;
        }

        RaceLiveMutationContext liveContext = liveMutationTracker.begin(racePlayer);
        if (!liveContext.active()) {
            return;
        }

        Instant decisionInstant = clock.instant();
        GameplayPresenceDecision presenceDecision =
                gameplayPresenceService.resolve(racePlayer, decisionInstant);
        boolean disconnected = gameplayTimelineService.settleBackground(
                racePlayer,
                decisionInstant,
                presenceDecision
        );

        if (disconnected) {
            racePlayerRepository.save(racePlayer);
            gameplayPresenceService.markOffline(racePlayer);
        }

        liveMutationTracker.recordChanges(liveContext, racePlayer);
    }

    @Transactional
    public void finalizeRaceIfComplete(Long raceId) {
        List<RacePlayer> lockedPlayers = racePlayerRepository
                .findAllLockedByRaceIdOrderById(raceId);

        if (lockedPlayers.isEmpty()) {
            return;
        }

        Race race = raceRepository.findLockedById(raceId).orElse(null);

        if (race == null || race.getStatus() != RaceStatus.IN_PROGRESS) {
            return;
        }

        RaceLiveState raceBefore = liveEventChangeRecorder.captureRace(race);

        Instant decisionInstant = clock.instant();
        List<FinalizationCandidate> absentPlayers = new ArrayList<>();
        List<PlayerChange> playerChanges = new ArrayList<>();

        for (RacePlayer racePlayer : lockedPlayers) {
            if (racePlayer.getStatus() == RacePlayerStatus.WAITING) {
                return;
            }

            if (racePlayer.getStatus() != RacePlayerStatus.RACING) {
                continue;
            }

            GameplayPresenceDecision presenceDecision =
                    gameplayPresenceService.resolve(racePlayer, decisionInstant);
            if (presenceDecision.blocksRaceCompletion()) {
                return;
            }

            absentPlayers.add(new FinalizationCandidate(
                    racePlayer,
                    presenceDecision
            ));
        }

        for (FinalizationCandidate candidate : absentPlayers) {
            PlayerLiveState playerBefore = liveEventChangeRecorder.capturePlayer(
                    candidate.racePlayer()
            );
            boolean disconnected = gameplayTimelineService.settleForRaceFinalization(
                    candidate.racePlayer(),
                    decisionInstant,
                    candidate.presenceDecision()
            );
            if (disconnected) {
                gameplayPresenceService.markOffline(candidate.racePlayer());
            }
            playerChanges.add(new PlayerChange(playerBefore, candidate.racePlayer()));
        }

        if (!absentPlayers.isEmpty()) {
            racePlayerRepository.saveAllAndFlush(
                    absentPlayers.stream()
                            .map(FinalizationCandidate::racePlayer)
                            .toList()
            );
        }

        liveEventChangeRecorder.recordFinalizationPlayerChanges(race, playerChanges);
        raceFinishService.finishRaceIfAllPlayersTerminal(race, lockedPlayers);
        liveEventChangeRecorder.recordRaceChange(raceBefore, race);
    }

    private record FinalizationCandidate(
            RacePlayer racePlayer,
            GameplayPresenceDecision presenceDecision
    ) {
    }
}
