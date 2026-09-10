package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.RacePlayerStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StudentRaceOpponentResponse {

    private Long racePlayerId;
    private String displayName;
    private Integer laneNumber;
    private String vehicleTypeKey;
    private String vehicleColorKey;
    private String vehicleAssetKey;
    private Integer rank;
    private Double position;
    private Long positionAtEpochMs;
    private Double movementUnitsPerSecond;
    private RacePlayerStatus status;
    private Long finishedAtEpochMs;
}
