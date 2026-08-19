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

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerServiceTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-08-19T10:00:00Z");
    private static final ZoneId FIXED_ZONE = ZoneId.of("UTC");
    private static final LocalDateTime STARTED_AT =
            LocalDateTime.ofInstant(FIXED_INSTANT, FIXED_ZONE);

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Test
    void shouldStartWaitingPlayersRacingAtMinimumRacingSpeedWithMovementAnchor() {
        Race race = new Race();
        RacePlayer waitingPlayer = createPlayer(RacePlayerStatus.WAITING);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(waitingPlayer));

        int startedPlayers = createService().startWaitingPlayers(race, STARTED_AT);

        assertEquals(1, startedPlayers);
        assertEquals(RacePlayerStatus.RACING, waitingPlayer.getStatus());
        assertEquals(RaceProgressRules.MIN_RACING_SPEED, waitingPlayer.getSpeed());
        assertEquals(STARTED_AT, waitingPlayer.getStartedAt());
        // Continuous movement anchors at the exact RACING transition instant.
        assertEquals(
                FIXED_INSTANT.toEpochMilli(),
                waitingPlayer.getMovementUpdatedAtEpochMs()
        );
    }

    @Test
    void shouldNotTouchNonWaitingPlayersOnRaceStart() {
        Race race = new Race();
        RacePlayer disconnectedPlayer = createPlayer(RacePlayerStatus.DISCONNECTED);

        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(List.of(disconnectedPlayer));

        int startedPlayers = createService().startWaitingPlayers(race, STARTED_AT);

        assertEquals(0, startedPlayers);
        assertEquals(RacePlayerStatus.DISCONNECTED, disconnectedPlayer.getStatus());
        assertEquals(RacePlayerRules.DEFAULT_SPEED, disconnectedPlayer.getSpeed());
        assertNull(disconnectedPlayer.getStartedAt());
        assertNull(disconnectedPlayer.getMovementUpdatedAtEpochMs());
    }

    private RacePlayerService createService() {
        return new RacePlayerService(
                racePlayerRepository,
                Clock.fixed(FIXED_INSTANT, FIXED_ZONE)
        );
    }

    private RacePlayer createPlayer(RacePlayerStatus status) {
        RacePlayer player = new RacePlayer();
        player.setStatus(status);
        return player;
    }
}
