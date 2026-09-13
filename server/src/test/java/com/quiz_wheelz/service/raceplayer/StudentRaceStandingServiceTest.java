package com.quiz_wheelz.service.raceplayer;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.PlayerQuestionRepository;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.question.QuestionTimeoutService;
import com.quiz_wheelz.service.raceengine.RaceMovementCalculator;
import com.quiz_wheelz.service.raceengine.RaceMovementCalculator.Projection;
import com.quiz_wheelz.service.raceengine.RaceMovementService;
import com.quiz_wheelz.service.raceengine.RacePlayerGameplayTimelineService;
import com.quiz_wheelz.service.raceplayer.RacePlayerGameplayPresenceService.GameplayPresenceDecision;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StudentRaceStandingServiceTest {

    private static final long FINISH_EPOCH_MS = 1_787_048_000_000L;
    private static final long ANCHOR_EPOCH_MS = 1_787_047_000_000L;
    private static final long DECISION_EPOCH_MS = ANCHOR_EPOCH_MS + 10_000L;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    @Mock
    private StudentRaceStandingProjectionService standingProjectionService;

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
                new RaceStandingCalculator(ZoneOffset.UTC),
                standingProjectionService
        );
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 4, 8})
    void everyJoinedPlayerExceptSelfIsAnOpponent(int raceSize) {
        List<RacePlayer> players = activePlayers(raceSize);
        preparePlayers(players);
        RacePlayer current = players.get(raceSize - 1);

        StudentRaceStandingResult result = calculate(current);

        assertEquals(raceSize, result.playerCount());
        assertEquals(raceSize - 1, result.opponents().size());
        assertEquals(raceSize, result.rank());
        Set<Long> ids = new HashSet<>();
        for (StudentRaceStandingResult.Opponent opponent : result.opponents()) {
            assertTrue(ids.add(opponent.racePlayerId()));
            assertFalse(current.getId().equals(opponent.racePlayerId()));
        }
        verify(racePlayerRepository, times(1)).findByRaceOrderByLaneNumberAsc(race);
        verify(standingProjectionService).projectAt(players, current.getId(), DECISION_EPOCH_MS);
    }

    @Test
    void opponentsAreReturnedInStandingOrderWithServerRankAndIdentity() {
        List<RacePlayer> players = activePlayers(8);
        preparePlayers(players);

        StudentRaceStandingResult result = calculate(players.get(3));

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
    void projectedComparisonModelDecidesRankAndEmitsProjectedPositionAndAnchor() {
        RacePlayer current = player(1L, 100.0, RacePlayerStatus.RACING);
        current.setMovementUpdatedAtEpochMs(DECISION_EPOCH_MS);
        RacePlayer stale = player(2L, 96.0, RacePlayerStatus.RACING);
        RacePlayer behind = player(3L, 90.0, RacePlayerStatus.RACING);
        preparePlayers(List.of(current, stale, behind));
        when(standingProjectionService.projectAt(List.of(current, stale, behind), 1L, DECISION_EPOCH_MS))
                .thenReturn(Map.of(
                        2L, new Projection(100.0, DECISION_EPOCH_MS, null),
                        3L, new Projection(94.0, DECISION_EPOCH_MS - 500L, null)
                ));

        StudentRaceStandingResult result = calculate(current);

        assertEquals(1, result.rank());
        assertEquals(List.of(2L, 3L), opponentIds(result));
        StudentRaceStandingResult.Opponent tied = result.opponents().get(0);
        assertEquals(1, tied.rank());
        assertEquals(100.0, tied.position());
        assertEquals(DECISION_EPOCH_MS, tied.positionAtEpochMs());
        StudentRaceStandingResult.Opponent trailing = result.opponents().get(1);
        assertEquals(3, trailing.rank());
        assertEquals(94.0, trailing.position());
        assertEquals(DECISION_EPOCH_MS - 500L, trailing.positionAtEpochMs());
        var snapshot = new StudentRaceRuntimeSnapshotMapper().fromRacePlayer(
                current, result, DECISION_EPOCH_MS, 1L
        );
        assertEquals(4.0, snapshot.getOpponents().get(0).getMovementUnitsPerSecond());
        assertEquals(0.0, snapshot.getOpponents().get(1).getMovementUnitsPerSecond());
        assertEquals(1.0, behind.getSpeed());
        assertEquals(96.0, stale.getPosition());
        assertEquals(ANCHOR_EPOCH_MS + 2, stale.getMovementUpdatedAtEpochMs());
    }

    @Test
    void differentAnchorsRepresentingOnePositionTieForEitherRequester() {
        StudentRaceStandingService realService = new StudentRaceStandingService(
                racePlayerRepository,
                new RaceStandingCalculator(ZoneOffset.UTC),
                realProjectionService()
        );
        RacePlayer settled = player(1L, 100.0, RacePlayerStatus.RACING);
        settled.setMovementUpdatedAtEpochMs(DECISION_EPOCH_MS);
        RacePlayer stale = player(2L, 96.0, RacePlayerStatus.RACING);
        stale.setMovementUpdatedAtEpochMs(DECISION_EPOCH_MS - 1_000L);
        preparePlayers(List.of(settled, stale));

        StudentRaceStandingResult seenBySettled = realService.calculate(settled, DECISION_EPOCH_MS);
        stale.setPosition(100.0);
        stale.setMovementUpdatedAtEpochMs(DECISION_EPOCH_MS);
        StudentRaceStandingResult seenByStale = realService.calculate(stale, DECISION_EPOCH_MS);

        assertEquals(1, seenBySettled.rank());
        assertEquals(1, seenBySettled.opponents().get(0).rank());
        assertEquals(100.0, seenBySettled.opponents().get(0).position());
        assertEquals(DECISION_EPOCH_MS, seenBySettled.opponents().get(0).positionAtEpochMs());
        assertEquals(1, seenByStale.rank());
        assertEquals(1, seenByStale.opponents().get(0).rank());
        assertEquals(100.0, seenByStale.opponents().get(0).position());
    }

    @Test
    void settledRosterOverloadRanksStoredPositionsWithoutProjectionOrRepositoryAccess() {
        List<RacePlayer> players = activePlayers(3);

        StudentRaceStandingResult result = standingService.calculate(players.get(1), players);

        assertEquals(2, result.rank());
        assertEquals(3, result.playerCount());
        assertEquals(List.of(1L, 3L), opponentIds(result));
        verify(racePlayerRepository, never()).findByRaceOrderByLaneNumberAsc(race);
        verifyNoInteractions(standingProjectionService);
    }

    @Test
    void finishedOpponentExposesCanonicalFinishEpochAndFinishedStatus() {
        RacePlayer finished = player(1L, 1000.0, RacePlayerStatus.FINISHED);
        finished.setFinishedAtEpochMs(FINISH_EPOCH_MS);
        finished.setSpeed(0.0);
        RacePlayer current = player(2L, 500.0, RacePlayerStatus.RACING);
        preparePlayers(List.of(current, finished));

        StudentRaceStandingResult result = calculate(current);

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

        StudentRaceStandingResult result = calculate(current);

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

        assertEquals(1, calculate(tiedWithHigherId).rank());
        assertEquals(1, calculate(tiedWithLowerId).rank());
        assertEquals(3, calculate(third).rank());
    }

    @Test
    void finishedPlayersPrecedeActivePlayersByEarlierFinishEpoch() {
        RacePlayer first = finishedPlayer(1L, FINISH_EPOCH_MS + 1_000);
        RacePlayer second = finishedPlayer(2L, FINISH_EPOCH_MS + 3_000);
        RacePlayer racing = player(3L, 999.0, RacePlayerStatus.RACING);
        preparePlayers(List.of(racing, second, first));

        assertEquals(1, calculate(first).rank());
        assertEquals(2, calculate(second).rank());
        assertEquals(3, calculate(racing).rank());
    }

    @Test
    void disconnectedOpponentCountsRanksAndRetainsStatus() {
        RacePlayer disconnected = player(1L, 600.0, RacePlayerStatus.DISCONNECTED);
        RacePlayer current = player(2L, 500.0, RacePlayerStatus.RACING);
        RacePlayer behind = player(3L, 400.0, RacePlayerStatus.RACING);
        preparePlayers(List.of(current, behind, disconnected));

        StudentRaceStandingResult result = calculate(current);

        assertEquals(3, result.playerCount());
        assertEquals(2, result.rank());
        assertEquals(RacePlayerStatus.DISCONNECTED, result.opponents().get(0).status());
        assertEquals(List.of(1L, 3L), opponentIds(result));
    }

    private StudentRaceStandingResult calculate(RacePlayer current) {
        return standingService.calculate(current, DECISION_EPOCH_MS);
    }

    private StudentRaceStandingProjectionService realProjectionService() {
        RacePlayerGameplayPresenceService presenceService =
                mock(RacePlayerGameplayPresenceService.class);
        when(presenceService.resolve(any(), eq(Instant.ofEpochMilli(DECISION_EPOCH_MS))))
                .thenReturn(new GameplayPresenceDecision(true, true, false, DECISION_EPOCH_MS));
        PlayerQuestionRepository playerQuestionRepository = mock(PlayerQuestionRepository.class);
        when(playerQuestionRepository.findByRacePlayerInAndStatus(anyList(), eq(PlayerQuestionStatus.ACTIVE)))
                .thenReturn(List.of());

        return new StudentRaceStandingProjectionService(
                presenceService,
                new RacePlayerGameplayTimelineService(
                        mock(QuestionTimeoutService.class),
                        mock(RaceMovementService.class)
                ),
                playerQuestionRepository,
                new RaceMovementCalculator(),
                Clock.fixed(Instant.ofEpochMilli(DECISION_EPOCH_MS), ZoneOffset.UTC)
        );
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
