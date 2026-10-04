package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.PlayerQuestion;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.service.raceengine.RaceSpeedEffectMovementCalculator;
import com.quiz_wheelz.service.raceengine.RacePlayerSpeedEffectService;
import com.quiz_wheelz.entitys.RacePlayerSpeedEffect;
import com.quiz_wheelz.service.raceengine.RaceMovementCalculator.Projection;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import com.quiz_wheelz.utils.DateTimeUtils;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class StudentRaceStandingProjectionService {

    private final RacePlayerGameplayPresenceService gameplayPresenceService;
    private final RacePlayerGameplayTimelineService gameplayTimelineService;
    private final PlayerQuestionRepository playerQuestionRepository;
    private final RaceSpeedEffectMovementCalculator movementCalculator;
    private final RacePlayerSpeedEffectService effectService;
    private final Clock clock;

    public StudentRaceStandingProjectionService(
            RacePlayerGameplayPresenceService gameplayPresenceService,
            RacePlayerGameplayTimelineService gameplayTimelineService,
            PlayerQuestionRepository playerQuestionRepository,
            RaceSpeedEffectMovementCalculator movementCalculator,
            RacePlayerSpeedEffectService effectService,
            Clock clock
    ) {
        this.gameplayPresenceService = Objects.requireNonNull(gameplayPresenceService);
        this.gameplayTimelineService = Objects.requireNonNull(gameplayTimelineService);
        this.playerQuestionRepository = Objects.requireNonNull(playerQuestionRepository);
        this.movementCalculator = Objects.requireNonNull(movementCalculator);
        this.effectService = Objects.requireNonNull(effectService);
        this.clock = Objects.requireNonNull(clock);
    }

    public Map<Long, StudentRaceStandingProjection> projectAt(
            List<RacePlayer> racePlayers,
            Long currentRacePlayerId,
            long decisionEpochMs
    ) {
        List<RacePlayer> candidates = Objects.requireNonNull(racePlayers).stream()
                .filter(racePlayer -> isProjectable(racePlayer, currentRacePlayerId))
                .toList();

        if (candidates.isEmpty()) {
            return Map.of();
        }

        Map<Long, Long> activeQuestionExpiries = activeQuestionExpiries(candidates);
        Instant decisionInstant = Instant.ofEpochMilli(decisionEpochMs);
        long earliestAnchor = candidates.stream()
                .mapToLong(player -> Math.min(resolveAnchor(player, decisionEpochMs), decisionEpochMs))
                .min().orElse(decisionEpochMs);
        Map<Long, List<RacePlayerSpeedEffect>> effects = effectService.findRelevantForPlayers(
                candidates.stream().map(RacePlayer::getId).toList(), earliestAnchor, decisionEpochMs
        );
        Map<Long, StudentRaceStandingProjection> projections = new HashMap<>();

        for (RacePlayer racePlayer : candidates) {
            projections.put(
                    racePlayer.getId(),
                    project(
                            racePlayer,
                            decisionInstant,
                            activeQuestionExpiries.get(racePlayer.getId()),
                            effects.getOrDefault(racePlayer.getId(), List.of())
                    )
            );
        }

        return Map.copyOf(projections);
    }

    public Map<Long, StudentRaceStandingProjection> settledAt(
            List<RacePlayer> players, Long currentPlayerId, long decisionEpochMs
    ) {
        List<RacePlayer> candidates = players.stream()
                .filter(player -> isProjectable(player, currentPlayerId)).toList();
        Map<Long, List<RacePlayerSpeedEffect>> effects = effectService.findRelevantForPlayers(
                candidates.stream().map(RacePlayer::getId).toList(), decisionEpochMs, decisionEpochMs
        );
        Map<Long, StudentRaceStandingProjection> projections = new HashMap<>();
        for (RacePlayer player : candidates) {
            long anchor = resolveAnchor(player, decisionEpochMs);
            double speed = player.getSpeed() == null ? 0.0 : player.getSpeed();
            double effectiveSpeed = anchor < decisionEpochMs ? 0.0
                    : movementCalculator.effectiveSpeedAt(speed, decisionEpochMs,
                            effects.getOrDefault(player.getId(), List.of()));
            projections.put(player.getId(), new StudentRaceStandingProjection(
                    RaceStandingCalculator.storedPosition(player), anchor, null, effectiveSpeed));
        }
        return Map.copyOf(projections);
    }

    private boolean isProjectable(RacePlayer racePlayer, Long currentRacePlayerId) {
        Race race = racePlayer.getRace();

        return racePlayer.getId() != null
                && !racePlayer.getId().equals(currentRacePlayerId)
                && racePlayer.getStatus() == RacePlayerStatus.RACING
                && race != null
                && race.getStatus() == RaceStatus.IN_PROGRESS
                && race.getTotalDistance() != null;
    }

    private Map<Long, Long> activeQuestionExpiries(List<RacePlayer> candidates) {
        Map<Long, Long> expiries = new HashMap<>();
        List<PlayerQuestion> activeQuestions = playerQuestionRepository
                .findByRacePlayerInAndStatus(candidates, PlayerQuestionStatus.ACTIVE);

        for (PlayerQuestion question : activeQuestions) {
            if (question.getExpiresAt() == null || question.getRacePlayer() == null) {
                continue;
            }

            expiries.merge(
                    question.getRacePlayer().getId(),
                    DateTimeUtils.toEpochMilli(question.getExpiresAt(), clock.getZone()),
                    Math::min
            );
        }

        return expiries;
    }

    private StudentRaceStandingProjection project(
            RacePlayer racePlayer,
            Instant decisionInstant,
            Long activeQuestionExpiryEpochMs,
            List<RacePlayerSpeedEffect> effects
    ) {
        GameplayPresenceDecision presenceDecision =
                gameplayPresenceService.resolve(racePlayer, decisionInstant);
        long targetEpochMs = gameplayTimelineService.resolvePlayerRequestCutoff(
                decisionInstant,
                presenceDecision
        );

        if (activeQuestionExpiryEpochMs != null) {
            targetEpochMs = Math.min(targetEpochMs, activeQuestionExpiryEpochMs);
        }

        double position = RaceStandingCalculator.storedPosition(racePlayer);
        double speed = racePlayer.getSpeed() == null ? 0.0 : racePlayer.getSpeed();

        Projection movement = movementCalculator.project(
                position,
                speed,
                resolveAnchor(racePlayer, targetEpochMs),
                targetEpochMs,
                racePlayer.getRace().getTotalDistance(),
                effects
        );
        double effectiveSpeed = movement.crossedFinish() || movement.effectiveAtEpochMs() < decisionInstant.toEpochMilli()
                ? 0.0 : movementCalculator.effectiveSpeedAt(speed, movement.effectiveAtEpochMs(), effects);
        return new StudentRaceStandingProjection(movement.position(), movement.effectiveAtEpochMs(),
                movement.finishCrossingEpochMs(), effectiveSpeed);
    }

    private long resolveAnchor(RacePlayer racePlayer, long targetEpochMs) {
        if (racePlayer.getMovementUpdatedAtEpochMs() != null) {
            return racePlayer.getMovementUpdatedAtEpochMs();
        }

        if (racePlayer.getStartedAt() != null) {
            return DateTimeUtils.toEpochMilli(racePlayer.getStartedAt(), clock.getZone());
        }

        return targetEpochMs;
    }
}
