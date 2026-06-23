package com.quiz_wheelz.dto.teacher;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
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

    private List<TeacherRaceRoomPlayerResponse> players;

    public static TeacherRaceRoomResponse from(Race race) {
        return from(race, List.of());
    }

    public static TeacherRaceRoomResponse from(Race race, List<RacePlayer> players) {
        List<TeacherRaceRoomPlayerResponse> playerResponses = players.stream()
                .map(TeacherRaceRoomPlayerResponse::from)
                .toList();

        return new TeacherRaceRoomResponse(
                race.getId(),
                race.getTitle(),
                race.getRoomCode(),
                race.getSubject().getId(),
                race.getSubject().getName(),
                race.getSubject().getCode(),
                race.getStatus().name(),
                race.getMaxPlayers(),
                playerResponses.size(),
                race.getTotalDistance(),
                race.getCreatedAt(),
                race.getStartedAt(),
                race.getFinishedAt(),
                playerResponses
        );
    }
}