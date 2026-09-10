package com.quiz_wheelz.dto.raceplayer;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StudentRaceConfirmedFinisherResponse {

    private Long racePlayerId;
    private Long finishedAtEpochMs;
    private Integer rank;
}
