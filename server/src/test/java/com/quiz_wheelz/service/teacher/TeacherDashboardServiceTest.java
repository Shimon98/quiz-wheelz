package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.dto.teacher.TeacherDashboardResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RacePlayerRepository;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.auth.CurrentUserService;
import com.quiz_wheelz.service.auth.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherDashboardServiceTest {

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserService userService;

    @Mock
    private RaceRepository raceRepository;

    @Mock
    private RacePlayerRepository racePlayerRepository;

    private TeacherDashboardService service;

    @BeforeEach
    void setUp() {
        service = new TeacherDashboardService(
                currentUserService,
                userService,
                raceRepository,
                racePlayerRepository
        );
    }

    @Test
    void dashboardUsesOneBatchCountAndPreservesRepositoryOrder() {
        User teacher = teacher();
        List<Race> races = List.of(
                race(4L, RaceStatus.IN_PROGRESS),
                race(3L, RaceStatus.READY),
                race(2L, RaceStatus.WAITING_FOR_PLAYERS),
                race(1L, RaceStatus.FINISHED)
        );
        RacePlayerRepository.RacePlayerCountByRace waitingCount = playerCount(2L, 1L);
        RacePlayerRepository.RacePlayerCountByRace activeCount = playerCount(4L, 3L);
        RacePlayerRepository.RacePlayerCountByRace readyCount = playerCount(3L, 2L);
        prepareDashboard(teacher, races);
        when(racePlayerRepository.countPlayersByRaceIds(List.of(4L, 3L, 2L, 1L)))
                .thenReturn(List.of(
                        waitingCount,
                        activeCount,
                        readyCount
                ));

        TeacherDashboardResponse response = service.getDashboard();

        assertEquals(
                List.of(4L, 3L, 2L, 1L),
                response.getRaces().stream().map(race -> race.getRaceId()).toList()
        );
        assertEquals(
                List.of(3, 2, 1, 0),
                response.getRaces().stream().map(race -> race.getCurrentPlayers()).toList()
        );
        verify(racePlayerRepository).countPlayersByRaceIds(List.of(4L, 3L, 2L, 1L));
        verifyNoMoreInteractions(racePlayerRepository);
    }

    @Test
    void dashboardCountersUseServerNavigationStatuses() {
        User teacher = teacher();
        List<Race> races = List.of(
                race(5L, RaceStatus.WAITING_FOR_PLAYERS),
                race(4L, RaceStatus.READY),
                race(3L, RaceStatus.IN_PROGRESS),
                race(2L, RaceStatus.FINISHED),
                race(1L, RaceStatus.CANCELLED)
        );
        prepareDashboard(teacher, races);
        when(racePlayerRepository.countPlayersByRaceIds(List.of(5L, 4L, 3L, 2L, 1L)))
                .thenReturn(List.of());

        TeacherDashboardResponse response = service.getDashboard();

        assertEquals(5, response.getTotalRaces());
        assertEquals(1, response.getActiveRaces());
        assertEquals(1, response.getFinishedRaces());
        assertEquals(2, response.getWaitingRaces());
    }

    @Test
    void emptyDashboardIsZeroSafeAndSkipsPlayerCountQuery() {
        User teacher = teacher();
        prepareDashboard(teacher, List.of());

        TeacherDashboardResponse response = service.getDashboard();

        assertEquals("Teacher", response.getTeacherName());
        assertEquals(0, response.getTotalRaces());
        assertEquals(0, response.getActiveRaces());
        assertEquals(0, response.getFinishedRaces());
        assertEquals(0, response.getWaitingRaces());
        assertTrue(response.getRaces().isEmpty());
        verifyNoInteractions(racePlayerRepository);
    }

    @Test
    void operationDeclaresReadOnlyTransaction() throws NoSuchMethodException {
        Method method = TeacherDashboardService.class.getMethod("getDashboard");
        Transactional transactional = method.getAnnotation(Transactional.class);

        assertTrue(transactional.readOnly());
    }

    private void prepareDashboard(User teacher, List<Race> races) {
        when(currentUserService.getCurrentUserId()).thenReturn(teacher.getId());
        when(userService.findActiveByIdOrThrow(teacher.getId())).thenReturn(teacher);
        when(raceRepository.findByTeacherOrderByCreatedAtDesc(teacher)).thenReturn(races);
    }

    private User teacher() {
        User teacher = new User();
        teacher.setId(21L);
        teacher.setDisplayName("Teacher");
        return teacher;
    }

    private Race race(Long id, RaceStatus status) {
        Subject subject = new Subject();
        subject.setId(8L);
        subject.setName("Math");
        subject.setCode("MATH");

        Race race = new Race();
        race.setId(id);
        race.setTitle("Race " + id);
        race.setRoomCode("ROOM" + id);
        race.setSubject(subject);
        race.setStatus(status);
        race.setMaxPlayers(8);
        race.setTotalDistance(1000);
        race.setCreatedAt(LocalDateTime.of(2026, 9, 20, 12, 0).minusMinutes(id));
        return race;
    }

    private RacePlayerRepository.RacePlayerCountByRace playerCount(
            Long raceId,
            Long count
    ) {
        RacePlayerRepository.RacePlayerCountByRace projection =
                mock(RacePlayerRepository.RacePlayerCountByRace.class);
        when(projection.getRaceId()).thenReturn(raceId);
        when(projection.getPlayerCount()).thenReturn(count);
        return projection;
    }
}
