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

    /*
     * C1-03M: server decision instant this snapshot describes — the client
     * orders snapshots by it (network arrival order must never roll state
     * backward) — and the effective authoritative movement rate
     * (speed x BASE_MOVEMENT_UNITS_PER_SECOND), so the client can predict
     * visual motion without duplicating the server formula.
     */
    private Long snapshotAtEpochMs;
    private Double movementUnitsPerSecond;
}
