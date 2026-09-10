package com.quiz_wheelz.dto.raceplayer;

import com.fasterxml.jackson.databind.JsonNode;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class StudentRaceSnapshotContractFixture {

    public static final Set<String> SNAPSHOT_FIELDS = Set.of(
            "totalDistance",
            "score",
            "position",
            "positionAtEpochMs",
            "speed",
            "streak",
            "highestStreak",
            "currentDifficulty",
            "playerStatus",
            "raceStatus",
            "playerFinished",
            "raceFinished",
            "playerFinishedAtEpochMs",
            "snapshotAtEpochMs",
            "movementUnitsPerSecond",
            "eventVersion",
            "rank",
            "playerCount",
            "opponents"
    );

    public static final Set<String> OPPONENT_FIELDS = Set.of(
            "racePlayerId",
            "displayName",
            "laneNumber",
            "vehicleTypeKey",
            "vehicleColorKey",
            "vehicleAssetKey",
            "rank",
            "position",
            "positionAtEpochMs",
            "movementUnitsPerSecond",
            "status",
            "finishedAtEpochMs"
    );

    private StudentRaceSnapshotContractFixture() {
    }

    public static StudentRaceRuntimeSnapshotResponse snapshot() {
        return new StudentRaceRuntimeSnapshotResponse(
                1000,
                420,
                350.0,
                1_787_147_999_800L,
                1.2,
                3,
                5,
                Difficulty.MEDIUM,
                RacePlayerStatus.RACING,
                RaceStatus.IN_PROGRESS,
                false,
                false,
                null,
                1_787_148_000_000L,
                4.8,
                153L,
                2,
                5,
                List.of(new StudentRaceOpponentResponse(
                        92L,
                        "Avi",
                        4,
                        "TOY_CAR",
                        "BLUE",
                        "TOY_CAR_BLUE",
                        1,
                        420.0,
                        1_787_147_999_100L,
                        0.0,
                        RacePlayerStatus.DISCONNECTED,
                        null
                ))
        );
    }

    public static Set<String> fieldNames(JsonNode node) {
        Set<String> names = new HashSet<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }
}
