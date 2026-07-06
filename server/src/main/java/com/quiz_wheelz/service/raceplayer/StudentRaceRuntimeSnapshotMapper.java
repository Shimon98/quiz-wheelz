package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.dto.raceengine.AnswerRaceImpact;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class StudentRaceRuntimeSnapshotMapper {

    public StudentRaceRuntimeSnapshotResponse fromRacePlayer(RacePlayer racePlayer) {
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
                race.getStatus() == RaceStatus.FINISHED
        );
    }

    public StudentRaceRuntimeSnapshotResponse fromAnswerRaceImpact(
            AnswerRaceImpact impact,
            Race race
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
                impact.isRaceFinished()
        );
    }
}
