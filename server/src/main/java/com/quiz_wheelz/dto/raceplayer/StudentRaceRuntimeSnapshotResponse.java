package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StudentRaceRuntimeSnapshotResponse {

    private Integer totalDistance;

    private Integer score;
    private Double position;
    private Double speed;

    private Integer streak;
    private Integer highestStreak;

    private Difficulty currentDifficulty;

    private RacePlayerStatus playerStatus;
    private RaceStatus raceStatus;

    private boolean playerFinished;
    private boolean raceFinished;

    private Long snapshotAtEpochMs;
    private Double movementUnitsPerSecond;
}
