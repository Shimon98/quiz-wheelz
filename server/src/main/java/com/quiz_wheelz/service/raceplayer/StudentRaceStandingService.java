package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RacePlayerRules;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.repository.RacePlayerRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class StudentRaceStandingService {

    private final RacePlayerRepository racePlayerRepository;
    private final RaceStandingCalculator standingCalculator;

    public StudentRaceStandingService(
            RacePlayerRepository racePlayerRepository,
            RaceStandingCalculator standingCalculator
    ) {
        this.racePlayerRepository = Objects.requireNonNull(racePlayerRepository);
        this.standingCalculator = Objects.requireNonNull(standingCalculator);
    }

    public StudentRaceStandingResult calculate(RacePlayer currentRacePlayer) {
        Objects.requireNonNull(currentRacePlayer);
        Race race = Objects.requireNonNull(currentRacePlayer.getRace());

        return calculate(
                currentRacePlayer,
                racePlayerRepository.findByRaceOrderByLaneNumberAsc(race)
        );
    }

    public StudentRaceStandingResult calculate(
            RacePlayer currentRacePlayer,
            List<RacePlayer> authoritativePlayers
    ) {
        Objects.requireNonNull(currentRacePlayer);
        Long currentRacePlayerId = Objects.requireNonNull(currentRacePlayer.getId());

        List<RaceStandingCalculator.RankedRacePlayer> standings =
                standingCalculator.calculate(authoritativePlayers);

        RaceStandingCalculator.RankedRacePlayer currentStanding = null;
        List<StudentRaceStandingResult.Opponent> opponents = new ArrayList<>();

        for (RaceStandingCalculator.RankedRacePlayer standing : standings) {
            if (currentRacePlayerId.equals(standing.racePlayer().getId())) {
                currentStanding = standing;
            } else {
                opponents.add(toOpponent(standing));
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

    private StudentRaceStandingResult.Opponent toOpponent(
            RaceStandingCalculator.RankedRacePlayer standing
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
                racePlayer.getPosition(),
                racePlayer.getMovementUpdatedAtEpochMs(),
                racePlayer.getSpeed(),
                racePlayer.getStatus(),
                racePlayer.getFinishedAtEpochMs()
        );
    }
}
