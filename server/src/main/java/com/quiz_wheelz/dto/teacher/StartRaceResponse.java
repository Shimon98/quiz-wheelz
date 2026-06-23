package com.quiz_wheelz.dto.teacher;

import com.quiz_wheelz.entitys.Race;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
@Setter
@Getter
@AllArgsConstructor
public class StartRaceResponse {

    private Long raceId;
    private String roomCode;
    private String status;
    private LocalDateTime startedAt;
    private Integer playersStarted;

    public static StartRaceResponse from(Race race, int playersStarted) {
        return new StartRaceResponse(
                race.getId(),
                race.getRoomCode(),
                race.getStatus().name(),
                race.getStartedAt(),
                playersStarted
        );
    }
}