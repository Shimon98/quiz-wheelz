package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.dto.raceplayer.NearbyRacePlayerResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;

@Component
public class StudentRaceRuntimeSnapshotMapper {

    public StudentRaceRuntimeSnapshotResponse fromRacePlayer(
            RacePlayer racePlayer,
            StudentRaceStandingResult standing,
            long snapshotAtEpochMs
    ) {
        Objects.requireNonNull(racePlayer);
        Objects.requireNonNull(standing);

        Race race = Objects.requireNonNull(racePlayer.getRace());

        return new StudentRaceRuntimeSnapshotResponse(
                race.getTotalDistance(),
                racePlayer.getScore(),
                racePlayer.getPosition(),
                racePlayer.getSpeed(),
                racePlayer.getStreak(),
                racePlayer.getHighestStreak(),
                racePlayer.getCurrentDifficulty(),
                racePlayer.getStatus(),
                race.getStatus(),
                racePlayer.getStatus() == RacePlayerStatus.FINISHED,
                race.getStatus() == RaceStatus.FINISHED,
                snapshotAtEpochMs,
                movementUnitsPerSecond(racePlayer.getSpeed()),
                standing.rank(),
                standing.playerCount(),
                mapNearbyPlayers(standing)
        );
    }

    public StudentRaceRuntimeSnapshotResponse fromAnswerRaceImpact(
            AnswerRaceImpact impact,
            Race race,
            StudentRaceStandingResult standing,
            long snapshotAtEpochMs
    ) {
        Objects.requireNonNull(impact);
        Objects.requireNonNull(race);
        Objects.requireNonNull(standing);

        return new StudentRaceRuntimeSnapshotResponse(
                race.getTotalDistance(),
                impact.getNewScore(),
                impact.getNewPosition(),
                impact.getNewSpeed(),
                impact.getNewStreak(),
                impact.getHighestStreak(),
                impact.getNextDifficulty(),
                impact.getPlayerStatus(),
                impact.getRaceStatus(),
                impact.isPlayerFinished(),
                impact.isRaceFinished(),
                snapshotAtEpochMs,
                movementUnitsPerSecond(impact.getNewSpeed()),
                standing.rank(),
                standing.playerCount(),
                mapNearbyPlayers(standing)
        );
    }

    private List<NearbyRacePlayerResponse> mapNearbyPlayers(
            StudentRaceStandingResult standing
    ) {
        return standing.nearbyPlayers().stream()
                .map(nearbyPlayer -> new NearbyRacePlayerResponse(
                        nearbyPlayer.racePlayerId(),
                        nearbyPlayer.displayName(),
                        nearbyPlayer.laneNumber(),
                        nearbyPlayer.vehicleTypeKey(),
                        nearbyPlayer.vehicleColorKey(),
                        nearbyPlayer.position(),
                        nearbyPlayer.speed(),
                        nearbyPlayer.status()
                ))
                .toList();
    }

    private double movementUnitsPerSecond(Double speed) {
        double safeSpeed = speed == null ? 0.0 : speed;

        return safeSpeed * RaceProgressRules.BASE_MOVEMENT_UNITS_PER_SECOND;
    }
}
