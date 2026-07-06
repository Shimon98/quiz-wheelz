package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.enums.RacePlayerReconnectOutcome;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class RacePlayerReconnectResponse {

    private Long raceId;
    private Long racePlayerId;
    private RacePlayerReconnectOutcome outcome;
    private boolean online;
    private boolean canContinueRace;
    private RacePlayerStatus playerStatus;
    private RaceStatus raceStatus;
    private LocalDateTime resolvedAt;
}
