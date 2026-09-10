package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.repository.RacePlayerRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
public class StudentRaceStandingService {

    private static final int MAX_NEARBY_PLAYERS = 4;
    private static final int PREFERRED_PLAYERS_PER_SIDE = 2;

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
        Long currentRacePlayerId = Objects.requireNonNull(currentRacePlayer.getId());

        List<RaceStandingCalculator.RankedRacePlayer> standings =
                standingCalculator.calculate(
                        racePlayerRepository.findByRaceOrderByLaneNumberAsc(race)
                );

        int currentIndex = findCurrentIndex(standings, currentRacePlayerId);
        RaceStandingCalculator.RankedRacePlayer currentStanding =
                standings.get(currentIndex);
        List<StudentRaceStandingResult.NearbyPlayer> nearbyPlayers =
                selectNearbyPlayers(standings, currentIndex);

        return new StudentRaceStandingResult(
                currentStanding.rank(),
                standings.size(),
                nearbyPlayers
        );
    }

    private int findCurrentIndex(
            List<RaceStandingCalculator.RankedRacePlayer> standings,
            Long currentRacePlayerId
    ) {
        for (int index = 0; index < standings.size(); index++) {
            if (currentRacePlayerId.equals(standings.get(index).racePlayer().getId())) {
                return index;
            }
        }

        throw new IllegalStateException();
    }

    private List<StudentRaceStandingResult.NearbyPlayer> selectNearbyPlayers(
            List<RaceStandingCalculator.RankedRacePlayer> standings,
            int currentIndex
    ) {
        int playersAhead = Math.min(PREFERRED_PLAYERS_PER_SIDE, currentIndex);
        int playersBehind = Math.min(
                PREFERRED_PLAYERS_PER_SIDE,
                standings.size() - currentIndex - 1
        );
        int remainingSlots = MAX_NEARBY_PLAYERS - playersAhead - playersBehind;

        int additionalAhead = Math.min(remainingSlots, currentIndex - playersAhead);
        playersAhead += additionalAhead;
        remainingSlots -= additionalAhead;

        int availableBehind = standings.size() - currentIndex - 1 - playersBehind;
        playersBehind += Math.min(remainingSlots, availableBehind);

        List<StudentRaceStandingResult.NearbyPlayer> nearbyPlayers = new ArrayList<>();
        int firstIndex = currentIndex - playersAhead;
        int lastIndex = currentIndex + playersBehind;

        for (int index = firstIndex; index <= lastIndex; index++) {
            if (index != currentIndex) {
                nearbyPlayers.add(toNearbyPlayer(standings.get(index).racePlayer()));
            }
        }

        return List.copyOf(nearbyPlayers);
    }

    private StudentRaceStandingResult.NearbyPlayer toNearbyPlayer(RacePlayer racePlayer) {
        return new StudentRaceStandingResult.NearbyPlayer(
                racePlayer.getId(),
                racePlayer.getDisplayName(),
                racePlayer.getLaneNumber(),
                racePlayer.getVehicleTypeKey(),
                racePlayer.getVehicleColorKey(),
                racePlayer.getPosition(),
                racePlayer.getSpeed(),
                racePlayer.getStatus()
        );
    }
}
