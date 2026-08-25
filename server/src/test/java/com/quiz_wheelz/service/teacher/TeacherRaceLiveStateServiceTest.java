package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.common.RaceProgressRules;
import com.quiz_wheelz.dto.teacher.TeacherRaceLiveStateResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RaceFocusPolicy;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.auth.CurrentUserService;
import com.quiz_wheelz.service.auth.UserService;
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
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherRaceLiveStateServiceTest {

    private static final Instant NOW = Instant.parse("2026-08-24T12:00:00Z");

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserService userService;

    @Mock
    private RaceRepository raceRepository;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    private User teacher;
    private TeacherRaceLiveStateService service;

    @BeforeEach
    void setUp() {
        teacher = new User();
        teacher.setId(5L);
        service = new TeacherRaceLiveStateService(
                currentUserService,
                userService,
                raceRepository,
                new TeacherRaceLivePlayerSnapshotService(
                        racePlayerRepository,
                        new RaceStandingCalculator()
                ),
                Clock.fixed(NOW, ZoneOffset.UTC)
        );
    }

    @Test
    void ownerReceivesOneRankedSnapshotWithAllPlayerStatuses() {
        Race race = race(RaceStatus.IN_PROGRESS, 7L);
        RacePlayer finished = player(1L, 1000.0, RacePlayerStatus.FINISHED);
        finished.setFinishedAt(LocalDateTime.of(2026, 8, 24, 14, 59));
        RacePlayer racing = player(2L, 700.0, RacePlayerStatus.RACING);
        RacePlayer disconnected = player(3L, 500.0, RacePlayerStatus.DISCONNECTED);
        RacePlayer waiting = player(4L, 0.0, RacePlayerStatus.WAITING);
        prepareOwnedRace(race, List.of(waiting, disconnected, racing, finished));

        TeacherRaceLiveStateResponse response = service.getLiveState(race.getId());

        assertEquals(race.getId(), response.getRaceId());
        assertEquals("IN_PROGRESS", response.getStatus());
        assertEquals(NOW.toEpochMilli(), response.getServerTimeEpochMs());
        assertEquals(
                RaceProgressRules.BASE_MOVEMENT_UNITS_PER_SECOND,
                response.getBaseMovementUnitsPerSecond()
        );
        assertEquals(7L, response.getEventVersion());
        assertEquals(
                List.of("FINISHED", "RACING", "DISCONNECTED", "WAITING"),
                response.getPlayers().stream().map(player -> player.getStatus()).toList()
        );
        assertEquals(
                List.of(1, 2, 3, 4),
                response.getPlayers().stream().map(player -> player.getRank()).toList()
        );

        verify(currentUserService).getCurrentUserId();
        verify(userService).findActiveByIdOrThrow(teacher.getId());
        verify(raceRepository).findByIdAndTeacher(race.getId(), teacher);
        verify(racePlayerRepository).findByRaceOrderByLaneNumberAsc(race);
        verifyNoMoreInteractions(
                currentUserService,
                userService,
                raceRepository,
                racePlayerRepository
        );
    }

    @ParameterizedTest
    @EnumSource(RaceStatus.class)
    void everyDurableRaceStatusIsReadable(RaceStatus status) {
        Race race = race(status, 0L);
        prepareOwnedRace(race, List.of());

        TeacherRaceLiveStateResponse response = service.getLiveState(race.getId());

        assertEquals(status.name(), response.getStatus());
    }

    @Test
    void foreignRaceIsHiddenAsRaceNotFound() {
        prepareMissingOwnedRace(91L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.getLiveState(91L)
        );

        assertEquals(ErrorCode.RACE_NOT_FOUND, exception.getErrorCode());
        verifyNoInteractions(racePlayerRepository);
    }

    @Test
    void missingRaceUsesTheSameRaceNotFoundError() {
        prepareMissingOwnedRace(404L);

        ApiException exception = assertThrows(
                ApiException.class,
                () -> service.getLiveState(404L)
        );

        assertEquals(ErrorCode.RACE_NOT_FOUND, exception.getErrorCode());
        verifyNoInteractions(racePlayerRepository);
    }

    @Test
    void repeatedReadsReturnZeroWithoutIncrementOrPersistence() {
        Race race = race(RaceStatus.READY, 0L);
        prepareOwnedRace(race, List.of());

        TeacherRaceLiveStateResponse first = service.getLiveState(race.getId());
        TeacherRaceLiveStateResponse second = service.getLiveState(race.getId());

        assertEquals(0L, first.getEventVersion());
        assertEquals(0L, second.getEventVersion());
        assertEquals(0L, race.getLiveEventVersion());
        verify(raceRepository, times(2)).findByIdAndTeacher(race.getId(), teacher);
        verify(racePlayerRepository, times(2)).findByRaceOrderByLaneNumberAsc(race);
    }

    @Test
    void nonZeroEventVersionIsReturnedExactly() {
        Race race = race(RaceStatus.FINISHED, 81L);
        prepareOwnedRace(race, List.of());

        TeacherRaceLiveStateResponse response = service.getLiveState(race.getId());

        assertEquals(81L, response.getEventVersion());
    }

    @Test
    void operationDeclaresReadOnlyTransaction() throws NoSuchMethodException {
        Method method = TeacherRaceLiveStateService.class.getMethod(
                "getLiveState",
                Long.class
        );
        Transactional transactional = method.getAnnotation(Transactional.class);

        assertTrue(transactional.readOnly());
    }

    @Test
    void serviceHasNoGameplayRuntimeDependencies() {
        Set<String> forbiddenDependencies = Set.of(
                "RacePlayerGameplayPresenceService",
                "RedisPresenceService",
                "RaceMovementService",
                "RacePlayerGameplayTimelineService",
                "QuestionTimeoutService",
                "RaceEngineService",
                "RacePlayerReconnectService"
        );

        boolean containsForbiddenDependency = Arrays.stream(
                        TeacherRaceLiveStateService.class.getDeclaredFields()
                )
                .map(field -> field.getType().getSimpleName())
                .anyMatch(forbiddenDependencies::contains);

        assertFalse(containsForbiddenDependency);
    }

    private void prepareOwnedRace(Race race, List<RacePlayer> players) {
        when(currentUserService.getCurrentUserId()).thenReturn(teacher.getId());
        when(userService.findActiveByIdOrThrow(teacher.getId())).thenReturn(teacher);
        when(raceRepository.findByIdAndTeacher(race.getId(), teacher))
                .thenReturn(Optional.of(race));
        when(racePlayerRepository.findByRaceOrderByLaneNumberAsc(race))
                .thenReturn(players);
    }

    private void prepareMissingOwnedRace(Long raceId) {
        when(currentUserService.getCurrentUserId()).thenReturn(teacher.getId());
        when(userService.findActiveByIdOrThrow(teacher.getId())).thenReturn(teacher);
        when(raceRepository.findByIdAndTeacher(raceId, teacher)).thenReturn(Optional.empty());
    }

    private Race race(RaceStatus status, Long liveEventVersion) {
        Race race = new Race();
        race.setId(12L);
        race.setTitle("Math Race");
        race.setRoomCode("ABC123");
        race.setStatus(status);
        race.setTotalDistance(1000);
        race.setMaxPlayers(8);
        race.setFocusPolicy(RaceFocusPolicy.WARN);
        race.setLiveEventVersion(liveEventVersion);
        return race;
    }

    private RacePlayer player(Long id, Double position, RacePlayerStatus status) {
        RacePlayer racePlayer = new RacePlayer();
        racePlayer.setId(id);
        racePlayer.setDisplayName("Player " + id);
        racePlayer.setLaneNumber(id.intValue());
        racePlayer.setVehicleTypeKey("HOVER_KART");
        racePlayer.setVehicleColorKey("GREEN");
        racePlayer.setPosition(position);
        racePlayer.setSpeed(1.0);
        racePlayer.setScore(20);
        racePlayer.setStreak(2);
        racePlayer.setStatus(status);
        return racePlayer;
    }
}
