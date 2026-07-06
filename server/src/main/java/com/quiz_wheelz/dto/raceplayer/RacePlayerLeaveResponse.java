package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.RacePlayerStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class RacePlayerLeaveResponse {

    private Long racePlayerId;
    private LocalDateTime leftAt;
    private RacePlayerStatus playerStatus;
}
