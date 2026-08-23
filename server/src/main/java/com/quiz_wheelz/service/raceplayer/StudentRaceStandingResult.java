package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.enums.RacePlayerStatus;

import java.util.List;
import java.util.Objects;

public record StudentRaceStandingResult(
        int rank,
        int playerCount,
        List<NearbyPlayer> nearbyPlayers
) {

    public StudentRaceStandingResult {
        nearbyPlayers = List.copyOf(Objects.requireNonNull(nearbyPlayers));
    }

    public record NearbyPlayer(
            Long racePlayerId,
            String displayName,
            Integer laneNumber,
            String vehicleTypeKey,
            String vehicleColorKey,
            Double position,
            Double speed,
            RacePlayerStatus status
    ) {
    }
}
