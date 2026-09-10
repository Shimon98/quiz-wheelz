package com.quiz_wheelz.dto.teacher;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.quiz_wheelz.common.RacePlayerRules;
import com.quiz_wheelz.entitys.RacePlayer;
import lombok.Getter;

@Getter
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

    @JsonCreator
    public TeacherRaceLivePlayerResponse(
            @JsonProperty("racePlayerId") Long racePlayerId,
            @JsonProperty("displayName") String displayName,
            @JsonProperty("laneNumber") Integer laneNumber,
            @JsonProperty("vehicleTypeKey") String vehicleTypeKey,
            @JsonProperty("vehicleColorKey") String vehicleColorKey,
            @JsonProperty("vehicleAssetKey") String vehicleAssetKey,
            @JsonProperty("rank") Integer rank,
            @JsonProperty("position") Double position,
            @JsonProperty("speed") Double speed,
            @JsonProperty("score") Integer score,
            @JsonProperty("streak") Integer streak,
            @JsonProperty("status") String status
    ) {
        this.racePlayerId = racePlayerId;
        this.displayName = displayName;
        this.laneNumber = laneNumber;
        this.vehicleTypeKey = vehicleTypeKey;
        this.vehicleColorKey = vehicleColorKey;
        this.vehicleAssetKey = vehicleAssetKey;
        this.rank = rank;
        this.position = position;
        this.speed = speed;
        this.score = score;
        this.streak = streak;
        this.status = status;
    }

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
