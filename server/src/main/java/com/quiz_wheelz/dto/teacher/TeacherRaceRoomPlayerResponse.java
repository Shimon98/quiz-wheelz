package com.quiz_wheelz.dto.teacher;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TeacherRaceRoomPlayerResponse {

    private Long playerId;
    private String studentName;
    private Integer laneNumber;
    private String carColor;
    private Integer position;
    private Integer score;
    private Integer streak;
    private String status;
}