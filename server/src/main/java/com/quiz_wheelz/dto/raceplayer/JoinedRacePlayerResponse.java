package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.common.RacePlayerRules;
import com.quiz_wheelz.entitys.RacePlayer;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class JoinedRacePlayerResponse {

    private Long playerId;
    private String displayName;
    private Integer laneNumber;
    private String vehicleTypeKey;
    private String vehicleColorKey;
    private String vehicleAssetKey;
    private String status;

    public static JoinedRacePlayerResponse from(RacePlayer player) {
        return new JoinedRacePlayerResponse(
                player.getId(),
                player.getDisplayName(),
                player.getLaneNumber(),
                player.getVehicleTypeKey(),
                player.getVehicleColorKey(),
                player.getVehicleTypeKey()
                        + RacePlayerRules.VEHICLE_ASSET_SEPARATOR
                        + player.getVehicleColorKey(),
                player.getStatus().name()
        );
    }
}
