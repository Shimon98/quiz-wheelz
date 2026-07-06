package com.quiz_wheelz.dto.raceplayer;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class RacePlayerHeartbeatResponse {

    private Long raceId;
    private Long racePlayerId;
    private LocalDateTime heartbeatAt;
}
