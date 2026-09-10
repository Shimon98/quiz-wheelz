package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentRaceStandingServiceTest {

    private static final long FINISH_EPOCH_MS = 1_787_048_000_000L;
    private static final long ANCHOR_EPOCH_MS = 1_787_047_000_000L;

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
                new RaceStandingCalculator(ZoneOffset.UTC)
        );
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 4, 8})
    void everyJoinedPlayerExceptSelfIsAnOpponent(int raceSize) {
        List<RacePlayer> players = activePlayers(raceSize);
        preparePlayers(players);
        RacePlayer current = players.get(raceSize - 1);

        StudentRaceStandingResult result = standingService.calculate(current);

        assertEquals(raceSize, result.playerCount());
        assertEquals(raceSize - 1, result.opponents().size());
        assertEquals(raceSize, result.rank());
        Set<Long> ids = new HashSet<>();
        for (StudentRaceStandingResult.Opponent opponent : result.opponents()) {
            assertTrue(ids.add(opponent.racePlayerId()));
            assertFalse(current.getId().equals(opponent.racePlayerId()));
        }
        verify(racePlayerRepository, times(1)).findByRaceOrderByLaneNumberAsc(race);
    }

    @Test
    void opponentsAreReturnedInStandingOrderWithServerRankAndIdentity() {
        List<RacePlayer> players = activePlayers(8);
        preparePlayers(players);

        StudentRaceStandingResult result = standingService.calculate(players.get(3));

        assertEquals(List.of(1L, 2L, 3L, 5L, 6L, 7L, 8L), opponentIds(result));
        assertEquals(List.of(1, 2, 3, 5, 6, 7, 8), result.opponents().stream()
                .map(StudentRaceStandingResult.Opponent::rank)
                .toList());
        StudentRaceStandingResult.Opponent first = result.opponents().get(0);
        assertEquals("Player 1", first.displayName());
        assertEquals(1, first.laneNumber());
        assertEquals("TOY_CAR", first.vehicleTypeKey());
        assertEquals("PURPLE", first.vehicleColorKey());
        assertEquals("TOY_CAR_PURPLE", first.vehicleAssetKey());
        assertEquals(800.0, first.position());
        assertEquals(ANCHOR_EPOCH_MS + 1, first.positionAtEpochMs());
        assertEquals(1.0, first.speed());
        assertEquals(RacePlayerStatus.RACING, first.status());
        assertNull(first.finishedAtEpochMs());
    }

    @Test
    void preloadedRosterOverloadRanksWithoutRepositoryAccess() {
        List<RacePlayer> players = activePlayers(3);

        StudentRaceStandingResult result = standingService.calculate(players.get(1), players);

        assertEquals(2, result.rank());
        assertEquals(3, result.playerCount());
        assertEquals(List.of(1L, 3L), opponentIds(result));
        verify(racePlayerRepository, never()).findByRaceOrderByLaneNumberAsc(race);
    }

    @Test
    void finishedOpponentExposesCanonicalFinishEpochAndFinishedStatus() {
        RacePlayer finished = player(1L, 1000.0, RacePlayerStatus.FINISHED);
        finished.setFinishedAtEpochMs(FINISH_EPOCH_MS);
        finished.setSpeed(0.0);
        RacePlayer current = player(2L, 500.0, RacePlayerStatus.RACING);
        preparePlayers(List.of(current, finished));

        StudentRaceStandingResult result = standingService.calculate(current);

        assertEquals(2, result.rank());
        StudentRaceStandingResult.Opponent opponent = result.opponents().get(0);
        assertEquals(1, opponent.rank());
        assertEquals(RacePlayerStatus.FINISHED, opponent.status());
        assertEquals(FINISH_EPOCH_MS, opponent.finishedAtEpochMs());
    }

    @Test
    void waitingOpponentWithoutAnchorKeepsNullPositionTime() {
        RacePlayer waiting = player(1L, 0.0, RacePlayerStatus.WAITING);
        waiting.setMovementUpdatedAtEpochMs(null);
        RacePlayer current = player(2L, 0.0, RacePlayerStatus.WAITING);
        current.setMovementUpdatedAtEpochMs(null);
        preparePlayers(List.of(current, waiting));

        StudentRaceStandingResult result = standingService.calculate(current);

        assertNull(result.opponents().get(0).positionAtEpochMs());
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
    void finishedPlayersPrecedeActivePlayersByEarlierFinishEpoch() {
        RacePlayer first = finishedPlayer(1L, FINISH_EPOCH_MS + 1_000);
        RacePlayer second = finishedPlayer(2L, FINISH_EPOCH_MS + 3_000);
        RacePlayer racing = player(3L, 999.0, RacePlayerStatus.RACING);
        preparePlayers(List.of(racing, second, first));

        assertEquals(1, standingService.calculate(first).rank());
        assertEquals(2, standingService.calculate(second).rank());
        assertEquals(3, standingService.calculate(racing).rank());
    }

    @Test
    void disconnectedOpponentCountsRanksAndRetainsStatus() {
        RacePlayer disconnected = player(1L, 600.0, RacePlayerStatus.DISCONNECTED);
        RacePlayer current = player(2L, 500.0, RacePlayerStatus.RACING);
        RacePlayer behind = player(3L, 400.0, RacePlayerStatus.RACING);
        preparePlayers(List.of(current, behind, disconnected));

        StudentRaceStandingResult result = standingService.calculate(current);

        assertEquals(3, result.playerCount());
        assertEquals(2, result.rank());
        assertEquals(RacePlayerStatus.DISCONNECTED, result.opponents().get(0).status());
        assertEquals(List.of(1L, 3L), opponentIds(result));
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

    private RacePlayer finishedPlayer(Long id, long finishedAtEpochMs) {
        RacePlayer racePlayer = player(id, 1000.0, RacePlayerStatus.FINISHED);
        racePlayer.setFinishedAtEpochMs(finishedAtEpochMs);
        return racePlayer;
    }

    private RacePlayer player(Long id, Double position, RacePlayerStatus status) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(id);
        racePlayer.setRace(race);
        racePlayer.setDisplayName("Player " + id);
        racePlayer.setLaneNumber(id.intValue());
        racePlayer.setVehicleTypeKey("TOY_CAR");
        racePlayer.setVehicleColorKey(id == 1L ? "PURPLE" : "GREEN");
        racePlayer.setPosition(position);
        racePlayer.setSpeed(1.0);
        racePlayer.setStatus(status);
        racePlayer.setMovementUpdatedAtEpochMs(ANCHOR_EPOCH_MS + id);
        return racePlayer;
    }

    private List<Long> opponentIds(StudentRaceStandingResult result) {
        return result.opponents().stream()
                .map(StudentRaceStandingResult.Opponent::racePlayerId)
                .toList();
    }
}
