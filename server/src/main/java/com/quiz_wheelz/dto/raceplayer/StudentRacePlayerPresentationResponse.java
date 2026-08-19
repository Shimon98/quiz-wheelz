package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.common.RacePlayerRules;
import com.quiz_wheelz.entitys.RacePlayer;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StudentRacePlayerPresentationResponse {

    private Long racePlayerId;
    private String displayName;
    private Integer laneNumber;
    private String vehicleTypeKey;
    private String vehicleColorKey;
    private String vehicleAssetKey;

    public static StudentRacePlayerPresentationResponse from(RacePlayer racePlayer) {
        return new StudentRacePlayerPresentationResponse(
                racePlayer.getId(),
                racePlayer.getDisplayName(),
                racePlayer.getLaneNumber(),
                racePlayer.getVehicleTypeKey(),
                racePlayer.getVehicleColorKey(),
                RacePlayerRules.buildVehicleAssetKey(
                        racePlayer.getVehicleTypeKey(),
                        racePlayer.getVehicleColorKey()
                )
        );
    }
}
