package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.springframework.stereotype.Component;

import java.util.Objects;

/*
 * snapshotAtEpochMs is the SAME decision instant the producing service used
 * for expiry/settlement — one clock read per decision; the mapper never reads
 * time itself. movementUnitsPerSecond is server-owned so the client predicts
 * visual motion without duplicating speed x base-rate.
 */
@Component
public class StudentRaceRuntimeSnapshotMapper {

    public StudentRaceRuntimeSnapshotResponse fromRacePlayer(
            RacePlayer racePlayer,
            long snapshotAtEpochMs
    ) {
        Objects.requireNonNull(racePlayer);

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
                movementUnitsPerSecond(racePlayer.getSpeed())
        );
    }

    public StudentRaceRuntimeSnapshotResponse fromAnswerRaceImpact(
            AnswerRaceImpact impact,
            Race race,
            long snapshotAtEpochMs
    ) {
        Objects.requireNonNull(impact);
        Objects.requireNonNull(race);

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
                movementUnitsPerSecond(impact.getNewSpeed())
        );
    }

    private double movementUnitsPerSecond(Double speed) {
        double safeSpeed = speed == null ? 0.0 : speed;

        return safeSpeed * RaceProgressRules.BASE_MOVEMENT_UNITS_PER_SECOND;
    }
}
