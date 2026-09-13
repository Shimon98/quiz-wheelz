package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RacePlayerRules;
import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceengine.RaceMovementCalculator.Projection;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class StudentRaceStandingService {

    private final RacePlayerRepository racePlayerRepository;
    private final RaceStandingCalculator standingCalculator;
    private final StudentRaceStandingProjectionService standingProjectionService;

    public StudentRaceStandingService(
            RacePlayerRepository racePlayerRepository,
            RaceStandingCalculator standingCalculator,
            StudentRaceStandingProjectionService standingProjectionService
    ) {
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.standingCalculator = Objects.requireNonNull(standingCalculator);
        this.standingProjectionService = Objects.requireNonNull(standingProjectionService);
    }

    public StudentRaceStandingResult calculate(
            RacePlayer currentRacePlayer,
            long decisionEpochMs
    ) {
        Objects.requireNonNull(currentRacePlayer);
        Race race = Objects.requireNonNull(currentRacePlayer.getRace());
        List<RacePlayer> racePlayers = racePlayerRepository.findByRaceOrderByLaneNumberAsc(race);

        return calculate(
                currentRacePlayer,
                racePlayers,
                standingProjectionService.projectAt(
                        racePlayers,
                        currentRacePlayer.getId(),
                        decisionEpochMs
                ),
                decisionEpochMs
        );
    }

    public StudentRaceStandingResult calculate(
            RacePlayer currentRacePlayer,
            List<RacePlayer> settledPlayers
    ) {
        return calculate(currentRacePlayer, settledPlayers, Map.of(), null);
    }

    private StudentRaceStandingResult calculate(
            RacePlayer currentRacePlayer,
            List<RacePlayer> racePlayers,
            Map<Long, Projection> projections,
            Long decisionEpochMs
    ) {
        Objects.requireNonNull(currentRacePlayer);
        Long currentRacePlayerId = Objects.requireNonNull(currentRacePlayer.getId());

        List<RaceStandingCalculator.RankedRacePlayer> standings = standingCalculator.calculate(
                racePlayers,
                racePlayer -> comparedPosition(racePlayer, projections)
        );

        RaceStandingCalculator.RankedRacePlayer currentStanding = null;
        List<StudentRaceStandingResult.Opponent> opponents = new ArrayList<>();

        for (RaceStandingCalculator.RankedRacePlayer standing : standings) {
            if (currentRacePlayerId.equals(standing.racePlayer().getId())) {
                currentStanding = standing;
            } else {
                opponents.add(toOpponent(
                        standing,
                        projections.get(standing.racePlayer().getId()),
                        decisionEpochMs
                ));
            }
        }

        if (currentStanding == null) {
            throw new IllegalStateException();
        }

        return new StudentRaceStandingResult(
                currentStanding.rank(),
                standings.size(),
                opponents
        );
    }

    private double comparedPosition(RacePlayer racePlayer, Map<Long, Projection> projections) {
        Projection projection = projections.get(racePlayer.getId());

        return projection != null
                ? projection.position()
                : RaceStandingCalculator.storedPosition(racePlayer);
    }

    private StudentRaceStandingResult.Opponent toOpponent(
            RaceStandingCalculator.RankedRacePlayer standing,
            Projection projection,
            Long decisionEpochMs
    ) {
        RacePlayer racePlayer = standing.racePlayer();

        return new StudentRaceStandingResult.Opponent(
                racePlayer.getId(),
                racePlayer.getDisplayName(),
                racePlayer.getLaneNumber(),
                racePlayer.getVehicleTypeKey(),
                racePlayer.getVehicleColorKey(),
                RacePlayerRules.buildVehicleAssetKey(
                        racePlayer.getVehicleTypeKey(),
                        racePlayer.getVehicleColorKey()
                ),
                standing.rank(),
                projection != null ? Double.valueOf(projection.position()) : racePlayer.getPosition(),
                projection != null
                        ? Long.valueOf(projection.effectiveAtEpochMs())
                        : racePlayer.getMovementUpdatedAtEpochMs(),
                projectedSpeed(racePlayer, projection, decisionEpochMs),
                racePlayer.getStatus(),
                racePlayer.getFinishedAtEpochMs()
        );
    }

    private Double projectedSpeed(RacePlayer racePlayer, Projection projection, Long decisionEpochMs) {
        if (projection != null && (projection.crossedFinish()
                || projection.effectiveAtEpochMs() < Objects.requireNonNull(decisionEpochMs))) {
            return RaceProgressRules.FINISHED_SPEED;
        }

        return racePlayer.getSpeed();
    }
}
