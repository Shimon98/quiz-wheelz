package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RaceStandingCalculatorTest {

    private static final LocalDateTime FINISH_TIME =
            LocalDateTime.of(2026, 8, 24, 10, 0);

    private final RaceStandingCalculator calculator = new RaceStandingCalculator();

    @Test
    void finishedPlayersPrecedeOthersAndEarlierFinishersLead() {
        RacePlayer racing = player(1L, 999.0, RacePlayerStatus.RACING);
        RacePlayer laterFinisher = finishedPlayer(2L, FINISH_TIME.plusSeconds(2));
        RacePlayer earlierFinisher = finishedPlayer(3L, FINISH_TIME);

        List<RaceStandingCalculator.RankedRacePlayer> standings =
                calculator.calculate(List.of(racing, laterFinisher, earlierFinisher));

        assertEquals(List.of(3L, 2L, 1L), ids(standings));
        assertEquals(List.of(1, 2, 3), ranks(standings));
    }

    @Test
    void nonFinishedStatusesRankByDescendingNullSafePosition() {
        RacePlayer waiting = player(1L, 400.0, RacePlayerStatus.WAITING);
        RacePlayer racing = player(2L, 700.0, RacePlayerStatus.RACING);
        RacePlayer disconnected = player(3L, 500.0, RacePlayerStatus.DISCONNECTED);
        RacePlayer missingPosition = player(4L, null, RacePlayerStatus.RACING);

        List<RaceStandingCalculator.RankedRacePlayer> standings = calculator.calculate(
                List.of(waiting, missingPosition, disconnected, racing)
        );

        assertEquals(List.of(2L, 3L, 1L, 4L), ids(standings));
        assertEquals(List.of(1, 2, 3, 4), ranks(standings));
        assertEquals(RacePlayerStatus.DISCONNECTED, standings.get(1).racePlayer().getStatus());
    }

    @Test
    void equalPositionsShareCompetitionRankAndSkipTheNextRank() {
        RacePlayer higherId = player(9L, 500.0, RacePlayerStatus.RACING);
        RacePlayer lowerId = player(4L, 500.0, RacePlayerStatus.DISCONNECTED);
        RacePlayer third = player(2L, 400.0, RacePlayerStatus.WAITING);

        List<RaceStandingCalculator.RankedRacePlayer> standings =
                calculator.calculate(List.of(higherId, third, lowerId));

        assertEquals(List.of(4L, 9L, 2L), ids(standings));
        assertEquals(List.of(1, 1, 3), ranks(standings));
    }

    @Test
    void equalFinishTimesShareRankWithDeterministicOutput() {
        RacePlayer higherId = finishedPlayer(9L, FINISH_TIME);
        RacePlayer lowerId = finishedPlayer(4L, FINISH_TIME);
        RacePlayer later = finishedPlayer(2L, FINISH_TIME.plusSeconds(1));

        List<RaceStandingCalculator.RankedRacePlayer> first =
                calculator.calculate(List.of(higherId, later, lowerId));
        List<RaceStandingCalculator.RankedRacePlayer> second =
                calculator.calculate(List.of(later, lowerId, higherId));

        assertEquals(List.of(4L, 9L, 2L), ids(first));
        assertEquals(ids(first), ids(second));
        assertEquals(List.of(1, 1, 3), ranks(first));
    }

    @Test
    void nullFinishTimesAreSafeAndShareCompetitionRank() {
        RacePlayer higherId = finishedPlayer(9L, null);
        RacePlayer lowerId = finishedPlayer(4L, null);
        RacePlayer racing = player(2L, 1000.0, RacePlayerStatus.RACING);

        List<RaceStandingCalculator.RankedRacePlayer> standings =
                calculator.calculate(List.of(higherId, racing, lowerId));

        assertEquals(List.of(4L, 9L, 2L), ids(standings));
        assertEquals(List.of(1, 1, 3), ranks(standings));
    }

    @Test
    void calculationDoesNotMutateTheInputList() {
        RacePlayer behind = player(1L, 100.0, RacePlayerStatus.RACING);
        RacePlayer ahead = player(2L, 200.0, RacePlayerStatus.RACING);
        List<RacePlayer> input = new ArrayList<>(List.of(behind, ahead));

        calculator.calculate(input);

        assertEquals(List.of(behind, ahead), input);
    }

    private RacePlayer finishedPlayer(Long id, LocalDateTime finishedAt) {
        RacePlayer racePlayer = player(id, 1000.0, RacePlayerStatus.FINISHED);
        racePlayer.setFinishedAt(finishedAt);
        return racePlayer;
    }

    private RacePlayer player(Long id, Double position, RacePlayerStatus status) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(id);
        racePlayer.setDisplayName("Player " + id);
        racePlayer.setLaneNumber(id.intValue());
        racePlayer.setPosition(position);
        racePlayer.setStatus(status);
        return racePlayer;
    }

    private List<Long> ids(List<RaceStandingCalculator.RankedRacePlayer> standings) {
        return standings.stream()
                .map(standing -> standing.racePlayer().getId())
                .toList();
    }

    private List<Integer> ranks(List<RaceStandingCalculator.RankedRacePlayer> standings) {
        return standings.stream()
                .map(RaceStandingCalculator.RankedRacePlayer::rank)
                .toList();
    }
}
