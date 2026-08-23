package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.RacePlayerStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class NearbyRacePlayerResponse {

    private Long racePlayerId;
    private String displayName;
    private Integer laneNumber;
    private String vehicleTypeKey;
    private String vehicleColorKey;
    private Double position;
    private Double speed;
    private RacePlayerStatus status;
}
