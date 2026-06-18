package com.quiz_wheelz.service;

import com.quiz_wheelz.dto.race.CreateRaceRequest;
import com.quiz_wheelz.dto.race.RaceSummaryResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.repository.RaceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RaceServiceTest {

    @Mock
    private RaceRepository raceRepository;

    @Mock
    private RoomCodeService roomCodeService;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserService userService;

    @Mock
    private SubjectService subjectService;

    @InjectMocks
    private RaceService raceService;

    @Test
    void shouldCreateRaceSuccessfully() {
        CreateRaceRequest request = new CreateRaceRequest();
        request.setTitle("Race 1");
        request.setSubjectId(1L);
        request.setMaxPlayers(8);
        request.setTotalDistance(1000);

        User teacher = new User();
        teacher.setUsername("teacher");
        teacher.setDisplayName("Teacher");

        Subject subject = new Subject();
        subject.setName("Math");
        subject.setCode("MATH");
        subject.setActive(true);

        when(currentUserService.getCurrentUserId()).thenReturn(10L);
        when(userService.findActiveByIdOrThrow(10L)).thenReturn(teacher);
        when(subjectService.findActiveByIdOrThrow(1L)).thenReturn(subject);
        when(roomCodeService.generateUniqueRoomCode()).thenReturn("ABC234");

        when(raceRepository.save(any(Race.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RaceSummaryResponse response = raceService.createRace(request);

        assertNotNull(response);
        assertEquals("Race 1", response.getTitle());
        assertEquals("ABC234", response.getRoomCode());
        assertEquals("Math", response.getSubjectName());
        assertEquals("MATH", response.getSubjectCode());
        assertEquals("WAITING_FOR_PLAYERS", response.getStatus());
        assertEquals(8, response.getMaxPlayers());
        assertEquals(0, response.getCurrentPlayers());
        assertEquals(1000, response.getTotalDistance());

        verify(currentUserService).getCurrentUserId();
        verify(userService).findActiveByIdOrThrow(10L);
        verify(subjectService).findActiveByIdOrThrow(1L);
        verify(roomCodeService).generateUniqueRoomCode();
        verify(raceRepository).save(any(Race.class));
    }

    @Test
    void shouldSaveRaceWithCorrectFields() {
        CreateRaceRequest request = new CreateRaceRequest();
        request.setTitle("Algebra Race");
        request.setSubjectId(2L);
        request.setMaxPlayers(4);
        request.setTotalDistance(500);

        User teacher = new User();
        Subject subject = new Subject();
        subject.setName("Math");
        subject.setCode("MATH");

        when(currentUserService.getCurrentUserId()).thenReturn(7L);
        when(userService.findActiveByIdOrThrow(7L)).thenReturn(teacher);
        when(subjectService.findActiveByIdOrThrow(2L)).thenReturn(subject);
        when(roomCodeService.generateUniqueRoomCode()).thenReturn("XYZ789");

        when(raceRepository.save(any(Race.class))).thenAnswer(invocation -> {
            Race race = invocation.getArgument(0);

            assertEquals("Algebra Race", race.getTitle());
            assertEquals("XYZ789", race.getRoomCode());
            assertEquals(RaceStatus.WAITING_FOR_PLAYERS, race.getStatus());
            assertEquals(4, race.getMaxPlayers());
            assertEquals(500, race.getTotalDistance());
            assertSame(teacher, race.getTeacher());
            assertSame(subject, race.getSubject());

            return race;
        });

        raceService.createRace(request);

        verify(raceRepository).save(any(Race.class));
    }
}