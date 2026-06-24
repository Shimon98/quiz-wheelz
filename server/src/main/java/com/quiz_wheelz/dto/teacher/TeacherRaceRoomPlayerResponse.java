package com.quiz_wheelz.dto.teacher;

import com.quiz_wheelz.common.RacePlayerRules;
import com.quiz_wheelz.entitys.RacePlayer;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class TeacherRaceRoomPlayerResponse {

    private Long playerId;
    private String displayName;
    private Integer laneNumber;

    private String vehicleTypeKey;
    private String vehicleColorKey;
    private String vehicleAssetKey;

    private Double position;
    private Double speed;
    private Integer score;
    private Integer streak;
    private String status;

    private LocalDateTime joinedAt;

    public static TeacherRaceRoomPlayerResponse from(RacePlayer player) {
        return new TeacherRaceRoomPlayerResponse(
                player.getId(),
                player.getDisplayName(),
                player.getLaneNumber(),
                player.getVehicleTypeKey(),
                player.getVehicleColorKey(),
                buildVehicleAssetKey(player),
                player.getPosition(),
                player.getSpeed(),
                player.getScore(),
                player.getStreak(),
                player.getStatus().name(),
                player.getJoinedAt()
        );
    }

    private static String buildVehicleAssetKey(RacePlayer player) {
        return player.getVehicleTypeKey()
                + RacePlayerRules.VEHICLE_ASSET_SEPARATOR
                + player.getVehicleColorKey();
    }
}