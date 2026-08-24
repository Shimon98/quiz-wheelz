package com.quiz_wheelz.dto.teacher;

import com.quiz_wheelz.common.RacePlayerRules;
import com.quiz_wheelz.entitys.RacePlayer;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TeacherRaceLivePlayerResponse {

    private Long racePlayerId;
    private String displayName;
    private Integer laneNumber;
    private String vehicleTypeKey;
    private String vehicleColorKey;
    private String vehicleAssetKey;
    private Integer rank;
    private Double position;
    private Double speed;
    private Integer score;
    private Integer streak;
    private String status;

    public static TeacherRaceLivePlayerResponse from(RacePlayer racePlayer, int rank) {
        return new TeacherRaceLivePlayerResponse(
                racePlayer.getId(),
                racePlayer.getDisplayName(),
                racePlayer.getLaneNumber(),
                racePlayer.getVehicleTypeKey(),
                racePlayer.getVehicleColorKey(),
                RacePlayerRules.buildVehicleAssetKey(
                        racePlayer.getVehicleTypeKey(),
                        racePlayer.getVehicleColorKey()
                ),
                rank,
                racePlayer.getPosition(),
                racePlayer.getSpeed(),
                racePlayer.getScore(),
                racePlayer.getStreak(),
                racePlayer.getStatus().name()
        );
    }
}
