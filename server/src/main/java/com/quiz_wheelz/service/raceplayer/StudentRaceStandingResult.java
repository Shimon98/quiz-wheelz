package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.enums.RacePlayerStatus;

import java.util.List;
import java.util.Objects;

public record StudentRaceStandingResult(
        int rank,
        int playerCount,
        List<Opponent> opponents
) {

    public StudentRaceStandingResult {
        opponents = List.copyOf(Objects.requireNonNull(opponents));
    }

    public record Opponent(
            Long racePlayerId,
            String displayName,
            Integer laneNumber,
            String vehicleTypeKey,
            String vehicleColorKey,
            String vehicleAssetKey,
            int rank,
            Double position,
            Long positionAtEpochMs,
            Double speed,
            RacePlayerStatus status,
            Long finishedAtEpochMs
    ) {
    }
}
