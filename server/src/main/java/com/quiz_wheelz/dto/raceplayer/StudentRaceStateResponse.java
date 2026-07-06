package com.quiz_wheelz.dto.raceplayer;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class StudentRaceStateResponse {

    private Long raceId;
    private String raceTitle;
    private String roomCode;

    private LocalDateTime startedAt;
    private LocalDateTime finishedAt;

    private StudentRaceRuntimeSnapshotResponse snapshot;
}
