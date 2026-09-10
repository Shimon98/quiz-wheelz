package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RaceStandingCalculatorTest {

    private static final LocalDateTime FINISH_TIME =
            LocalDateTime.of(2026, 8, 24, 10, 0);
    private static final long FINISH_EPOCH_MS =
            FINISH_TIME.toInstant(ZoneOffset.UTC).toEpochMilli();

    private final RaceStandingCalculator calculator = new RaceStandingCalculator(ZoneOffset.UTC);

    @Test
    void finishedPlayersPrecedeOthersAndEarlierFinishersLead() {
        RacePlayer racing = player(1L, 999.0, RacePlayerStatus.RACING);
        RacePlayer laterFinisher = finishedPlayer(2L, FINISH_EPOCH_MS + 2_000);
        RacePlayer earlierFinisher = finishedPlayer(3L, FINISH_EPOCH_MS);

        List<RaceStandingCalculator.RankedRacePlayer> standings =
                calculator.calculate(List.of(racing, laterFinisher, earlierFinisher));

        assertEquals(List.of(3L, 2L, 1L), ids(standings));
        assertEquals(List.of(1, 2, 3), ranks(standings));
    }

    @Test
    void preciseFinishRankingUsesMillisecondEpochNotTheDerivedLocalDateTime() {
        RacePlayer laterByOneMs = finishedPlayer(1L, FINISH_EPOCH_MS + 1);
        RacePlayer earlierByOneMs = finishedPlayer(9L, FINISH_EPOCH_MS);
        laterByOneMs.setFinishedAt(FINISH_TIME);
        earlierByOneMs.setFinishedAt(FINISH_TIME);

        List<RaceStandingCalculator.RankedRacePlayer> standings =
                calculator.calculate(List.of(laterByOneMs, earlierByOneMs));

        assertEquals(List.of(9L, 1L), ids(standings));
        assertEquals(List.of(1, 2), ranks(standings));
    }

    @Test
    void sameMillisecondFinishesShareCompetitiveRankRegardlessOfIdOrLane() {
        RacePlayer higherId = finishedPlayer(9L, FINISH_EPOCH_MS);
        higherId.setLaneNumber(1);
        RacePlayer lowerId = finishedPlayer(4L, FINISH_EPOCH_MS);
        lowerId.setLaneNumber(8);
        RacePlayer later = finishedPlayer(2L, FINISH_EPOCH_MS + 1);

        List<RaceStandingCalculator.RankedRacePlayer> first =
                calculator.calculate(List.of(higherId, later, lowerId));
        List<RaceStandingCalculator.RankedRacePlayer> second =
                calculator.calculate(List.of(later, lowerId, higherId));

        assertEquals(List.of(4L, 9L, 2L), ids(first));
        assertEquals(ids(first), ids(second));
        assertEquals(List.of(1, 1, 3), ranks(first));
    }

    @Test
    void legacyFinishRecordsWithoutEpochKeepTheirHistoricalOrdering() {
        RacePlayer legacyEarlier = legacyFinishedPlayer(5L, FINISH_TIME);
        RacePlayer legacyLater = legacyFinishedPlayer(6L, FINISH_TIME.plusSeconds(3));
        RacePlayer legacyTied = legacyFinishedPlayer(7L, FINISH_TIME);

        List<RaceStandingCalculator.RankedRacePlayer> standings =
                calculator.calculate(List.of(legacyLater, legacyTied, legacyEarlier));

        assertEquals(List.of(5L, 7L, 6L), ids(standings));
        assertEquals(List.of(1, 1, 3), ranks(standings));
    }

    @Test
    void legacyAndPreciseRecordsOrderByTheSameInstantAxis() {
        RacePlayer legacy = legacyFinishedPlayer(5L, FINISH_TIME.plusSeconds(1));
        RacePlayer preciseEarlier = finishedPlayer(6L, FINISH_EPOCH_MS + 500);
        RacePlayer preciseLater = finishedPlayer(7L, FINISH_EPOCH_MS + 1_500);

        List<RaceStandingCalculator.RankedRacePlayer> standings =
                calculator.calculate(List.of(preciseLater, legacy, preciseEarlier));

        assertEquals(List.of(6L, 5L, 7L), ids(standings));
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
    void nullFinishTimesAreSafeAndShareCompetitionRank() {
        RacePlayer higherId = legacyFinishedPlayer(9L, null);
        RacePlayer lowerId = legacyFinishedPlayer(4L, null);
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

    private RacePlayer finishedPlayer(Long id, long finishedAtEpochMs) {
        RacePlayer racePlayer = player(id, 1000.0, RacePlayerStatus.FINISHED);
        racePlayer.setFinishedAtEpochMs(finishedAtEpochMs);
        return racePlayer;
    }

    private RacePlayer legacyFinishedPlayer(Long id, LocalDateTime finishedAt) {
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
