package com.quiz_wheelz.dto.raceplayer;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RacePlayerJoinResponse {

    private Long raceId;
    private String raceTitle;
    private String roomCode;
    private String raceStatus;
    private Integer maxPlayers;
    private Long currentPlayers;
    private JoinedRacePlayerResponse player;

    public static RacePlayerJoinResponse from(Race race, RacePlayer player, long currentPlayers) {
        return new RacePlayerJoinResponse(
                race.getId(),
                race.getTitle(),
                race.getRoomCode(),
                race.getStatus().name(),
                race.getMaxPlayers(),
                currentPlayers,
                JoinedRacePlayerResponse.from(player)
        );
    }
}
