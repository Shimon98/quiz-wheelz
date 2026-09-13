package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.dto.raceplayer.StudentRaceOpponentResponse;
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
            long snapshotAtEpochMs,
            long eventVersion
    ) {
        Objects.requireNonNull(racePlayer);
        Objects.requireNonNull(standing);

        Race race = Objects.requireNonNull(racePlayer.getRace());

        return new StudentRaceRuntimeSnapshotResponse(
                race.getTotalDistance(),
                racePlayer.getScore(),
                racePlayer.getPosition(),
                racePlayer.getMovementUpdatedAtEpochMs(),
                racePlayer.getSpeed(),
                racePlayer.getStreak(),
                racePlayer.getHighestStreak(),
                racePlayer.getCurrentDifficulty(),
                racePlayer.getStatus(),
                race.getStatus(),
                racePlayer.getStatus() == RacePlayerStatus.FINISHED,
                race.getStatus() == RaceStatus.FINISHED,
                racePlayer.getFinishedAtEpochMs(),
                snapshotAtEpochMs,
                movementUnitsPerSecond(
                        race.getStatus(),
                        racePlayer.getStatus(),
                        racePlayer.getSpeed()
                ),
                eventVersion,
                standing.rank(),
                standing.playerCount(),
                mapOpponents(race.getStatus(), standing)
        );
    }

    public StudentRaceRuntimeSnapshotResponse fromAnswerRaceImpact(
            AnswerRaceImpact impact,
            RacePlayer racePlayer,
            StudentRaceStandingResult standing,
            long snapshotAtEpochMs,
            long eventVersion
    ) {
        Objects.requireNonNull(impact);
        Objects.requireNonNull(racePlayer);
        Objects.requireNonNull(standing);

        Race race = Objects.requireNonNull(racePlayer.getRace());

        return new StudentRaceRuntimeSnapshotResponse(
                race.getTotalDistance(),
                impact.getNewScore(),
                impact.getNewPosition(),
                racePlayer.getMovementUpdatedAtEpochMs(),
                impact.getNewSpeed(),
                impact.getNewStreak(),
                impact.getHighestStreak(),
                impact.getNextDifficulty(),
                impact.getPlayerStatus(),
                impact.getRaceStatus(),
                impact.isPlayerFinished(),
                impact.isRaceFinished(),
                racePlayer.getFinishedAtEpochMs(),
                snapshotAtEpochMs,
                movementUnitsPerSecond(
                        impact.getRaceStatus(),
                        impact.getPlayerStatus(),
                        impact.getNewSpeed()
                ),
                eventVersion,
                standing.rank(),
                standing.playerCount(),
                mapOpponents(impact.getRaceStatus(), standing)
        );
    }

    private List<StudentRaceOpponentResponse> mapOpponents(
            RaceStatus raceStatus,
            StudentRaceStandingResult standing
    ) {
        return standing.opponents().stream()
                .map(opponent -> new StudentRaceOpponentResponse(
                        opponent.racePlayerId(),
                        opponent.displayName(),
                        opponent.laneNumber(),
                        opponent.vehicleTypeKey(),
                        opponent.vehicleColorKey(),
                        opponent.vehicleAssetKey(),
                        opponent.rank(),
                        opponent.position(),
                        opponent.positionAtEpochMs(),
                        movementUnitsPerSecond(
                                raceStatus,
                                opponent.status(),
                                opponent.speed()
                        ),
                        opponent.status(),
                        opponent.finishedAtEpochMs()
                ))
                .toList();
    }

    private double movementUnitsPerSecond(
            RaceStatus raceStatus,
            RacePlayerStatus playerStatus,
            Double speed
    ) {
        if (raceStatus != RaceStatus.IN_PROGRESS
                || playerStatus != RacePlayerStatus.RACING
                || speed == null) {
            return RaceProgressRules.FINISHED_SPEED;
        }

        return speed * RaceProgressRules.BASE_MOVEMENT_UNITS_PER_SECOND;
    }
}
