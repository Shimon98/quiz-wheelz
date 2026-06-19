package com.quiz_wheelz.dto.teacher;

import com.quiz_wheelz.common.RaceRules;
import com.quiz_wheelz.entitys.Race;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class TeacherRaceRoomResponse {

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
    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    private List<TeacherRaceRoomPlayerResponse> players; //כרגע יחזור מערך ריק כי אין עדיין RacePlayer

    public static TeacherRaceRoomResponse from(Race race) {
        return new TeacherRaceRoomResponse(
                race.getId(),
                race.getTitle(),
                race.getRoomCode(),
                race.getSubject().getId(),
                race.getSubject().getName(),
                race.getSubject().getCode(),
                race.getStatus().name(),
                race.getMaxPlayers(),
                RaceRules.DEFAULT_CURRENT_PLAYERS,
                race.getTotalDistance(),
                race.getCreatedAt(),
                race.getStartedAt(),
                race.getFinishedAt(),
                List.of()
        );
    }
}