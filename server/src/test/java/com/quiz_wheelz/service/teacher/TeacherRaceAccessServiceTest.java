package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.auth.CurrentUserService;
import com.quiz_wheelz.service.auth.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherRaceAccessServiceTest {

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserService userService;

    @Mock
    private RaceRepository raceRepository;

    private TeacherRaceAccessService service;
    private User teacher;

    @BeforeEach
    void setUp() {
        teacher = new User();
        teacher.setId(5L);
        service = new TeacherRaceAccessService(
                currentUserService,
                userService,
                raceRepository
        );
        when(currentUserService.getCurrentUserId()).thenReturn(teacher.getId());
        when(userService.findActiveByIdOrThrow(teacher.getId())).thenReturn(teacher);
    }

    @Test
    void ownerReceivesRaceThroughReadOnlyLookup() {
        Race race = new Race();
        when(raceRepository.findByIdAndTeacher(12L, teacher)).thenReturn(Optional.of(race));

        assertSame(race, service.requireOwnedRace(12L));
    }

    @Test
    void foreignAndMissingRaceUseTheSameHiddenError() {
        when(raceRepository.findByIdAndTeacher(91L, teacher)).thenReturn(Optional.empty());
        when(raceRepository.findByIdAndTeacher(404L, teacher)).thenReturn(Optional.empty());

        ApiException foreign = assertThrows(
                ApiException.class,
                () -> service.requireOwnedRace(91L)
        );
        ApiException missing = assertThrows(
                ApiException.class,
                () -> service.requireOwnedRace(404L)
        );

        assertEquals(ErrorCode.RACE_NOT_FOUND, foreign.getErrorCode());
        assertEquals(ErrorCode.RACE_NOT_FOUND, missing.getErrorCode());
    }

    @Test
    void updateLookupPreservesPessimisticRepositoryPath() {
        Race race = new Race();
        when(raceRepository.findByIdAndTeacherForUpdate(12L, teacher))
                .thenReturn(Optional.of(race));

        assertSame(race, service.requireOwnedRaceForUpdate(12L));
        verify(raceRepository).findByIdAndTeacherForUpdate(12L, teacher);
    }
}
