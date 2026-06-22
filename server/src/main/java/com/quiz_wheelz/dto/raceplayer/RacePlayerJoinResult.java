package com.quiz_wheelz.dto.raceplayer;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RacePlayerJoinResult {

    private RacePlayerJoinResponse response;
    private String racePlayerToken;
}
