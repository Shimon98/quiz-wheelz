package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentRaceStandingServiceTest {

    private static final LocalDateTime FINISH_TIME =
            LocalDateTime.of(2026, 8, 23, 10, 0);

    @Mock
    private RacePlayerRepository racePlayerRepository;

    private Race race;
    private StudentRaceStandingService standingService;

    @BeforeEach
    void setUp() {
        race = new Race();
        race.setId(1L);
        race.setStatus(RaceStatus.IN_PROGRESS);
        race.setTotalDistance(1000);
        race.setMaxPlayers(8);
        standingService = new StudentRaceStandingService(
                racePlayerRepository,
                new RaceStandingCalculator()
        );
    }

    @Test
    void oneJoinedPlayerProducesPlayerCountOne() {
        RacePlayer current = player(1L, 100.0, RacePlayerStatus.RACING);
        preparePlayers(List.of(current));

        StudentRaceStandingResult result = standingService.calculate(current);

        assertEquals(1, result.rank());
        assertEquals(1, result.playerCount());
        assertTrue(result.nearbyPlayers().isEmpty());
        verify(racePlayerRepository, times(1)).findByRaceOrderByLaneNumberAsc(race);
    }

    @Test
    void eightJoinedPlayersProducePlayerCountEight() {
        List<RacePlayer> players = activePlayers(8);
        preparePlayers(players);

        StudentRaceStandingResult result = standingService.calculate(players.get(3));

        assertEquals(8, result.playerCount());
    }

    @Test
    void activePlayersRankByDescendingPosition() {
        RacePlayer first = player(1L, 700.0, RacePlayerStatus.RACING);
        RacePlayer second = player(2L, 500.0, RacePlayerStatus.WAITING);
        RacePlayer third = player(3L, 200.0, RacePlayerStatus.DISCONNECTED);
        preparePlayers(List.of(third, first, second));

        assertEquals(1, standingService.calculate(first).rank());
        assertEquals(2, standingService.calculate(second).rank());
        assertEquals(3, standingService.calculate(third).rank());
    }

    @Test
    void equalActivePositionsShareCompetitionRankRegardlessOfLaneOrId() {
        RacePlayer tiedWithHigherId = player(50L, 500.0, RacePlayerStatus.RACING);
        tiedWithHigherId.setLaneNumber(1);
        RacePlayer tiedWithLowerId = player(10L, 500.0, RacePlayerStatus.RACING);
        tiedWithLowerId.setLaneNumber(8);
        RacePlayer third = player(2L, 400.0, RacePlayerStatus.RACING);
        preparePlayers(List.of(tiedWithHigherId, third, tiedWithLowerId));

        assertEquals(1, standingService.calculate(tiedWithHigherId).rank());
        assertEquals(1, standingService.calculate(tiedWithLowerId).rank());
        assertEquals(3, standingService.calculate(third).rank());
    }

    @Test
    void finishedPlayersPrecedeActivePlayersByEarlierFinishTime() {
        RacePlayer first = finishedPlayer(1L, FINISH_TIME.plusSeconds(1));
        RacePlayer second = finishedPlayer(2L, FINISH_TIME.plusSeconds(3));
        RacePlayer racing = player(3L, 999.0, RacePlayerStatus.RACING);
        preparePlayers(List.of(racing, second, first));

        assertEquals(1, standingService.calculate(first).rank());
        assertEquals(2, standingService.calculate(second).rank());
        assertEquals(3, standingService.calculate(racing).rank());
    }

    @Test
    void equalFinishTimesShareRankAndRemainDeterministic() {
        RacePlayer higherId = finishedPlayer(9L, FINISH_TIME);
        RacePlayer lowerId = finishedPlayer(4L, FINISH_TIME);
        RacePlayer racing = player(2L, 999.0, RacePlayerStatus.RACING);
        preparePlayers(List.of(higherId, racing, lowerId));

        StudentRaceStandingResult firstResult = standingService.calculate(higherId);
        StudentRaceStandingResult repeatedResult = standingService.calculate(higherId);

        assertEquals(1, firstResult.rank());
        assertEquals(1, standingService.calculate(lowerId).rank());
        assertEquals(3, standingService.calculate(racing).rank());
        assertEquals(nearbyIds(firstResult), nearbyIds(repeatedResult));
    }

    @Test
    void nullFinishedAtIsSafeDeterministicAndStillAheadOfActivePlayers() {
        RacePlayer knownFinish = finishedPlayer(1L, FINISH_TIME);
        RacePlayer missingFinish = finishedPlayer(2L, null);
        RacePlayer racing = player(3L, 999.0, RacePlayerStatus.RACING);
        preparePlayers(List.of(missingFinish, racing, knownFinish));

        assertEquals(1, standingService.calculate(knownFinish).rank());
        assertEquals(2, standingService.calculate(missingFinish).rank());
        assertEquals(3, standingService.calculate(racing).rank());
    }

    @Test
    void disconnectedPlayerCountsRanksAndRetainsStatusWhenNearby() {
        RacePlayer disconnected = player(1L, 600.0, RacePlayerStatus.DISCONNECTED);
        RacePlayer current = player(2L, 500.0, RacePlayerStatus.RACING);
        RacePlayer behind = player(3L, 400.0, RacePlayerStatus.RACING);
        preparePlayers(List.of(current, behind, disconnected));

        StudentRaceStandingResult result = standingService.calculate(current);

        assertEquals(3, result.playerCount());
        assertEquals(2, result.rank());
        StudentRaceStandingResult.NearbyPlayer nearbyDisconnected = result.nearbyPlayers()
                .stream()
                .filter(player -> player.racePlayerId().equals(disconnected.getId()))
                .findFirst()
                .orElseThrow();
        assertEquals(RacePlayerStatus.DISCONNECTED, nearbyDisconnected.status());
    }

    @Test
    void firstPlayerFillsNearbyWindowFromBehind() {
        List<RacePlayer> players = activePlayers(8);
        preparePlayers(players);

        StudentRaceStandingResult result = standingService.calculate(players.get(0));

        assertEquals(List.of(2L, 3L, 4L, 5L), nearbyIds(result));
        assertFalse(nearbyIds(result).contains(players.get(0).getId()));
    }

    @Test
    void lastPlayerFillsNearbyWindowFromAhead() {
        List<RacePlayer> players = activePlayers(8);
        preparePlayers(players);

        StudentRaceStandingResult result = standingService.calculate(players.get(7));

        assertEquals(List.of(4L, 5L, 6L, 7L), nearbyIds(result));
        assertFalse(nearbyIds(result).contains(players.get(7).getId()));
    }

    @Test
    void middlePlayerGetsTwoImmediatelyAheadAndBehind() {
        List<RacePlayer> players = activePlayers(8);
        preparePlayers(players);

        StudentRaceStandingResult result = standingService.calculate(players.get(3));

        assertEquals(List.of(2L, 3L, 5L, 6L), nearbyIds(result));
    }

    @Test
    void nearbyWindowReturnsOnlyAvailableOpponentsWithoutSelf() {
        List<RacePlayer> players = activePlayers(3);
        preparePlayers(players);

        StudentRaceStandingResult result = standingService.calculate(players.get(1));

        assertEquals(List.of(1L, 3L), nearbyIds(result));
        assertFalse(nearbyIds(result).contains(players.get(1).getId()));
    }

    @Test
    void nearbyWindowNeverExceedsFourAndRepeatsDeterministically() {
        List<RacePlayer> players = activePlayers(8);
        preparePlayers(players);

        StudentRaceStandingResult first = standingService.calculate(players.get(4));
        StudentRaceStandingResult second = standingService.calculate(players.get(4));

        assertEquals(4, first.nearbyPlayers().size());
        assertEquals(nearbyIds(first), nearbyIds(second));
    }

    private void preparePlayers(List<RacePlayer> players) {
        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(players);
    }

    private List<RacePlayer> activePlayers(int count) {
        List<RacePlayer> players = new ArrayList<>();

        for (long id = 1; id <= count; id++) {
            players.add(player(id, 900.0 - id * 100.0, RacePlayerStatus.RACING));
        }

        return players;
    }

    private RacePlayer finishedPlayer(Long id, LocalDateTime finishedAt) {
        RacePlayer racePlayer = player(id, 1000.0, RacePlayerStatus.FINISHED);
        racePlayer.setFinishedAt(finishedAt);
        return racePlayer;
    }

    private RacePlayer player(Long id, Double position, RacePlayerStatus status) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(id);
        racePlayer.setRace(race);
        racePlayer.setDisplayName("Player " + id);
        racePlayer.setLaneNumber(id.intValue());
        racePlayer.setVehicleTypeKey("HOVER_KART");
        racePlayer.setVehicleColorKey("GREEN");
        racePlayer.setPosition(position);
        racePlayer.setSpeed(1.0);
        racePlayer.setStatus(status);
        return racePlayer;
    }

    private List<Long> nearbyIds(StudentRaceStandingResult result) {
        return result.nearbyPlayers().stream()
                .map(StudentRaceStandingResult.NearbyPlayer::racePlayerId)
                .toList();
    }
}
