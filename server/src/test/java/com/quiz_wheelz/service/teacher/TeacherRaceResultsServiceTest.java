package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.dto.teacher.TeacherRaceResultAwardResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceResultPlayerResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceResultsResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.enums.TeacherRaceResultAwardType;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.service.raceplayer.RaceStandingCalculator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherRaceResultsServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Jerusalem");
    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-09-20T12:00:00Z"),
            ZONE
    );

    @Mock
    private TeacherRaceAccessService raceAccessService;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    private TeacherRaceResultsService service;

    @BeforeEach
    void setUp() {
        service = new TeacherRaceResultsService(
                raceAccessService,
                racePlayerRepository,
                new RaceStandingCalculator(ZONE),
                CLOCK
        );
    }

    @Test
    void ownedFinishedRaceReturnsCompleteAuthoritativeResult() {
        Race race = finishedRace();
        RacePlayer preciseWinner = player(
                91L,
                3,
                RacePlayerStatus.FINISHED,
                1000.0,
                850,
                14,
                2,
                7
        );
        long preciseFinishEpochMs = Instant.parse("2026-09-20T12:05:00.123Z").toEpochMilli();
        preciseWinner.setFinishedAtEpochMs(preciseFinishEpochMs);
        preciseWinner.setFinishedAt(LocalDateTime.of(2026, 9, 20, 15, 5));
        RacePlayer legacyFinisher = player(
                94L,
                1,
                RacePlayerStatus.FINISHED,
                1000.0,
                820,
                16,
                3,
                6
        );
        legacyFinisher.setFinishedAt(LocalDateTime.of(2026, 9, 20, 15, 6));
        RacePlayer disconnected = player(
                96L,
                2,
                RacePlayerStatus.DISCONNECTED,
                740.5,
                900,
                12,
                4,
                7
        );
        prepare(race, List.of(disconnected, legacyFinisher, preciseWinner));

        TeacherRaceResultsResponse response = service.getResults(race.getId());

        assertEquals(12L, response.raceId());
        assertEquals("Multiplication Race", response.title());
        assertEquals("ABC123", response.roomCode());
        assertEquals(3L, response.subject().getId());
        assertEquals("Mathematics", response.subject().getName());
        assertEquals("MATH", response.subject().getCode());
        assertEquals("FINISHED", response.status());
        assertEquals(8, response.maxPlayers());
        assertEquals(3, response.playerCount());
        assertEquals(1000, response.totalDistance());
        assertEquals(Instant.parse("2026-09-20T11:00:00Z").toEpochMilli(), response.startedAtEpochMs());
        assertEquals(Instant.parse("2026-09-20T11:20:00Z").toEpochMilli(), response.finishedAtEpochMs());
        assertEquals(List.of(91L), response.winnerRacePlayerIds());
        assertEquals(List.of(91L, 94L, 96L), ids(response.players()));
        assertEquals(List.of(1, 2, 3), ranks(response.players()));
        assertEquals(preciseFinishEpochMs, response.players().get(0).finishedAtEpochMs());
        assertEquals(
                Instant.parse("2026-09-20T12:06:00Z").toEpochMilli(),
                response.players().get(1).finishedAtEpochMs()
        );
        assertEquals(7, response.players().get(0).bestStreak());
        assertEquals("HOVER_KART_GREEN", response.players().get(0).vehicleAssetKey());
        assertEquals(740.5, response.players().get(2).position());
        assertNull(response.players().get(2).finishedAtEpochMs());
        assertEquals(2, response.summary().finishedPlayers());
        assertEquals(1, response.summary().disconnectedPlayers());
        assertEquals(42, response.summary().totalCorrectAnswers());
        assertEquals(9, response.summary().totalWrongAnswers());
        assertEquals(
                List.of(
                        new TeacherRaceResultAwardResponse(
                                TeacherRaceResultAwardType.HIGHEST_SCORE,
                                List.of(96L),
                                900
                        ),
                        new TeacherRaceResultAwardResponse(
                                TeacherRaceResultAwardType.MOST_CORRECT_ANSWERS,
                                List.of(94L),
                                16
                        ),
                        new TeacherRaceResultAwardResponse(
                                TeacherRaceResultAwardType.BEST_STREAK,
                                List.of(91L, 96L),
                                7
                        )
                ),
                response.awards()
        );

        verify(raceAccessService).requireOwnedRace(race.getId());
        verify(racePlayerRepository).findByRaceOrderByLaneNumberAsc(race);
        verifyNoMoreInteractions(raceAccessService, racePlayerRepository);
    }

    @ParameterizedTest
    @EnumSource(value = RaceStatus.class, names = "FINISHED", mode = EnumSource.Mode.EXCLUDE)
    void nonFinishedRaceStatusRejectsResultsBeforePlayerRead(RaceStatus status) {
        Race race = finishedRace();
        race.setStatus(status);
        when(raceAccessService.requireOwnedRace(race.getId())).thenReturn(race);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.getResults(race.getId())
        );

        assertEquals(ErrorCode.RACE_RESULTS_NOT_AVAILABLE, exception.getErrorCode());
        verify(racePlayerRepository, never()).findByRaceOrderByLaneNumberAsc(race);
    }

    @Test
    void missingRacePreservesHiddenNotFoundError() {
        when(raceAccessService.requireOwnedRace(404L))
                .thenThrow(new ApiException(ErrorCode.RACE_NOT_FOUND));

        ApiException exception = assertThrows(ApiException.class, () -> service.getResults(404L));

        assertEquals(ErrorCode.RACE_NOT_FOUND, exception.getErrorCode());
        verifyNoInteractions(racePlayerRepository);
    }

    @Test
    void foreignRacePreservesHiddenNotFoundError() {
        when(raceAccessService.requireOwnedRace(91L))
                .thenThrow(new ApiException(ErrorCode.RACE_NOT_FOUND));

        ApiException exception = assertThrows(ApiException.class, () -> service.getResults(91L));

        assertEquals(ErrorCode.RACE_NOT_FOUND, exception.getErrorCode());
        verifyNoInteractions(racePlayerRepository);
    }

    @Test
    void exactFirstPlaceTieReturnsEveryWinnerInStableStandingOrder() {
        Race race = finishedRace();
        RacePlayer secondStable = player(103L, 1, RacePlayerStatus.FINISHED, 1000.0, 20, 2, 1, 1);
        RacePlayer firstStable = player(91L, 2, RacePlayerStatus.FINISHED, 1000.0, 10, 1, 2, 2);
        secondStable.setFinishedAtEpochMs(1_789_908_228_123L);
        firstStable.setFinishedAtEpochMs(1_789_908_228_123L);
        prepare(race, List.of(secondStable, firstStable));

        TeacherRaceResultsResponse response = service.getResults(race.getId());

        assertEquals(List.of(91L, 103L), response.winnerRacePlayerIds());
        assertEquals(List.of(1, 1), ranks(response.players()));
    }

    @Test
    void allDisconnectedReturnsNoWinnerAndIncludesEveryPlayer() {
        Race race = finishedRace();
        RacePlayer leader = player(1L, 1, RacePlayerStatus.DISCONNECTED, 700.0, 1, 0, 0, 0);
        RacePlayer trailing = player(2L, 2, RacePlayerStatus.DISCONNECTED, 400.0, 0, 0, 0, 0);
        prepare(race, List.of(trailing, leader));

        TeacherRaceResultsResponse response = service.getResults(race.getId());

        assertEquals(List.of(), response.winnerRacePlayerIds());
        assertEquals(List.of(1L, 2L), ids(response.players()));
        assertEquals(List.of(1, 2), ranks(response.players()));
    }

    @Test
    void emptyPlayerListIsZeroSafeAndEmitsNoAwards() {
        Race race = finishedRace();
        prepare(race, List.of());

        TeacherRaceResultsResponse response = service.getResults(race.getId());

        assertEquals(0, response.playerCount());
        assertEquals(0, response.summary().finishedPlayers());
        assertEquals(0, response.summary().disconnectedPlayers());
        assertEquals(0, response.summary().totalCorrectAnswers());
        assertEquals(0, response.summary().totalWrongAnswers());
        assertEquals(List.of(), response.awards());
        assertEquals(List.of(), response.players());
    }

    @Test
    void samePlayerMayTruthfullyLeadEveryAward() {
        Race race = finishedRace();
        RacePlayer leader = player(1L, 1, RacePlayerStatus.FINISHED, 1000.0, 50, 9, 1, 6);
        leader.setFinishedAtEpochMs(100L);
        RacePlayer other = player(2L, 2, RacePlayerStatus.FINISHED, 1000.0, 20, 4, 2, 3);
        other.setFinishedAtEpochMs(200L);
        prepare(race, List.of(leader, other));

        TeacherRaceResultsResponse response = service.getResults(race.getId());

        assertEquals(3, response.awards().size());
        assertTrue(response.awards().stream().allMatch(award -> award.racePlayerIds().equals(List.of(1L))));
    }

    @Test
    void awardTiesPreserveFinalStandingOrderWithoutStatusExclusion() {
        Race race = finishedRace();
        RacePlayer finished = player(7L, 2, RacePlayerStatus.FINISHED, 1000.0, 60, 8, 1, 5);
        finished.setFinishedAtEpochMs(200L);
        RacePlayer disconnected = player(3L, 1, RacePlayerStatus.DISCONNECTED, 800.0, 60, 8, 1, 5);
        prepare(race, List.of(disconnected, finished));

        TeacherRaceResultsResponse response = service.getResults(race.getId());

        assertTrue(response.awards().stream().allMatch(
                award -> award.racePlayerIds().equals(List.of(7L, 3L))
        ));
    }

    @Test
    void zeroValueAwardsAreOmittedIndependently() {
        Race race = finishedRace();
        RacePlayer player = player(1L, 1, RacePlayerStatus.DISCONNECTED, 20.0, 10, 0, 0, 0);
        prepare(race, List.of(player));

        TeacherRaceResultsResponse response = service.getResults(race.getId());

        assertEquals(1, response.awards().size());
        assertEquals(TeacherRaceResultAwardType.HIGHEST_SCORE, response.awards().get(0).type());
    }

    @Test
    void repeatedReadsOverUnchangedStateAreEquivalentAndReadOnly() {
        Race race = finishedRace();
        RacePlayer player = player(1L, 1, RacePlayerStatus.FINISHED, 1000.0, 10, 1, 0, 1);
        player.setFinishedAtEpochMs(100L);
        prepare(race, List.of(player));

        TeacherRaceResultsResponse first = service.getResults(race.getId());
        TeacherRaceResultsResponse second = service.getResults(race.getId());

        assertEquivalent(first, second);
        verify(raceAccessService, times(2)).requireOwnedRace(race.getId());
        verify(racePlayerRepository, times(2)).findByRaceOrderByLaneNumberAsc(race);
    }

    @Test
    void operationDeclaresReadOnlyTransaction() throws NoSuchMethodException {
        Method method = TeacherRaceResultsService.class.getMethod("getResults", Long.class);
        Transactional transactional = method.getAnnotation(Transactional.class);

        assertTrue(transactional.readOnly());
    }

    @Test
    void serviceHasNoGameplayRedisOrEventDependencies() {
        Set<String> forbiddenDependencies = Set.of(
                "RaceMovementService",
                "RaceFinishService",
                "RaceFinishOrderPolicy",
                "RedisPresenceService",
                "RacePlayerGameplayPresenceService",
                "RaceLiveEventRecorder",
                "TeacherRaceLiveStreamService"
        );

        boolean containsForbiddenDependency = Arrays.stream(
                        TeacherRaceResultsService.class.getDeclaredFields()
                )
                .map(field -> field.getType().getSimpleName())
                .anyMatch(forbiddenDependencies::contains);

        assertFalse(containsForbiddenDependency);
    }

    private void prepare(Race race, List<RacePlayer> players) {
        when(raceAccessService.requireOwnedRace(race.getId())).thenReturn(race);
        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race)).thenReturn(players);
    }

    private Race finishedRace() {
        Subject subject = new Subject();
        subject.setId(3L);
        subject.setName("Mathematics");
        subject.setCode("MATH");

        Race race = new Race();
        race.setId(12L);
        race.setTitle("Multiplication Race");
        race.setRoomCode("ABC123");
        race.setSubject(subject);
        race.setStatus(RaceStatus.FINISHED);
        race.setMaxPlayers(8);
        race.setTotalDistance(1000);
        race.setStartedAt(LocalDateTime.of(2026, 9, 20, 14, 0));
        race.setFinishedAt(LocalDateTime.of(2026, 9, 20, 14, 20));
        return race;
    }

    private RacePlayer player(
            Long id,
            int laneNumber,
            RacePlayerStatus status,
            double position,
            int score,
            int correctAnswers,
            int wrongAnswers,
            int highestStreak
    ) {
        RacePlayer player = new RacePlayer();
        player.setId(id);
        player.setDisplayName("Player " + id);
        player.setLaneNumber(laneNumber);
        player.setVehicleTypeKey("HOVER_KART");
        player.setVehicleColorKey("GREEN");
        player.setStatus(status);
        player.setPosition(position);
        player.setScore(score);
        player.setCorrectAnswers(correctAnswers);
        player.setWrongAnswers(wrongAnswers);
        player.setHighestStreak(highestStreak);
        return player;
    }

    private List<Long> ids(List<TeacherRaceResultPlayerResponse> players) {
        return players.stream().map(TeacherRaceResultPlayerResponse::racePlayerId).toList();
    }

    private List<Integer> ranks(List<TeacherRaceResultPlayerResponse> players) {
        return players.stream().map(TeacherRaceResultPlayerResponse::rank).toList();
    }

    private void assertEquivalent(
            TeacherRaceResultsResponse first,
            TeacherRaceResultsResponse second
    ) {
        assertEquals(first.raceId(), second.raceId());
        assertEquals(first.title(), second.title());
        assertEquals(first.roomCode(), second.roomCode());
        assertEquals(first.subject().getId(), second.subject().getId());
        assertEquals(first.subject().getName(), second.subject().getName());
        assertEquals(first.subject().getCode(), second.subject().getCode());
        assertEquals(first.status(), second.status());
        assertEquals(first.maxPlayers(), second.maxPlayers());
        assertEquals(first.playerCount(), second.playerCount());
        assertEquals(first.totalDistance(), second.totalDistance());
        assertEquals(first.startedAtEpochMs(), second.startedAtEpochMs());
        assertEquals(first.finishedAtEpochMs(), second.finishedAtEpochMs());
        assertEquals(first.winnerRacePlayerIds(), second.winnerRacePlayerIds());
        assertEquals(first.summary(), second.summary());
        assertEquals(first.awards(), second.awards());
        assertEquals(first.players(), second.players());
    }
}
