package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.common.RacePlayerRules;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerServiceTest {

    private static final LocalDateTime STARTED_AT =
            LocalDateTime.of(2026, 8, 19, 10, 0);

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Test
    void shouldStartWaitingPlayersRacingAtMinimumRacingSpeed() {
        Race race = new Race();
        RacePlayer waitingPlayer = createPlayer(RacePlayerStatus.WAITING);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(waitingPlayer));

        int startedPlayers = new RacePlayerService(racePlayerRepository)
                .startWaitingPlayers(race, STARTED_AT);

        assertEquals(1, startedPlayers);
        assertEquals(RacePlayerStatus.RACING, waitingPlayer.getStatus());
        assertEquals(RaceProgressRules.MIN_RACING_SPEED, waitingPlayer.getSpeed());
        assertEquals(STARTED_AT, waitingPlayer.getStartedAt());
    }

    @Test
    void shouldNotTouchNonWaitingPlayersOnRaceStart() {
        Race race = new Race();
        RacePlayer disconnectedPlayer = createPlayer(RacePlayerStatus.DISCONNECTED);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(disconnectedPlayer));

        int startedPlayers = new RacePlayerService(racePlayerRepository)
                .startWaitingPlayers(race, STARTED_AT);

        assertEquals(0, startedPlayers);
        assertEquals(RacePlayerStatus.DISCONNECTED, disconnectedPlayer.getStatus());
        assertEquals(RacePlayerRules.DEFAULT_SPEED, disconnectedPlayer.getSpeed());
        assertNull(disconnectedPlayer.getStartedAt());
    }

    private RacePlayer createPlayer(RacePlayerStatus status) {
        RacePlayer player = new RacePlayer();
        player.setStatus(status);
        return player;
    }
}
