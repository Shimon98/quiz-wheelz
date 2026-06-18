package com.quiz_wheelz.dto.race;

import com.quiz_wheelz.entitys.Race;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class RaceSummaryResponse {

    private Long raceId;
    private String title;
    private String roomCode;
    private Long subjectId;
    private String subjectName;
    private String subjectCode;
    private String status;
    private Integer maxPlayers;
    private Integer currentPlayers;
    private Integer totalDistance;
    private LocalDateTime createdAt;

    public static RaceSummaryResponse from(Race race) {
        return new RaceSummaryResponse(
                race.getId(),
                race.getTitle(),
                race.getRoomCode(),
                race.getSubject().getId(),
                race.getSubject().getName(),
                race.getSubject().getCode(),
                race.getStatus().name(),
                race.getMaxPlayers(),
                0,
                race.getTotalDistance(),
                race.getCreatedAt()
        );
    }
}