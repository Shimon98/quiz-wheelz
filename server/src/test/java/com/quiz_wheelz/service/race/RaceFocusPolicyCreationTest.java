package com.quiz_wheelz.service.race;

import com.quiz_wheelz.dto.race.CreateRaceRequest;
import com.quiz_wheelz.dto.race.RaceSummaryResponse;
import com.quiz_wheelz.entitys.Race;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.enums.RaceFocusPolicy;
import com.quiz_wheelz.repository.RaceRepository;
import com.quiz_wheelz.service.auth.CurrentUserService;
import com.quiz_wheelz.service.auth.UserService;
import com.quiz_wheelz.service.subject.SubjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RaceFocusPolicyCreationTest {

    private RaceRepository raceRepository;
    private RaceService raceService;

    @BeforeEach
    void setUp() {
        raceRepository = mock(RaceRepository.class);
        RoomCodeService roomCodeService = mock(RoomCodeService.class);
        CurrentUserService currentUserService = mock(CurrentUserService.class);
        UserService userService = mock(UserService.class);
        SubjectService subjectService = mock(SubjectService.class);

        when(currentUserService.getCurrentUserId()).thenReturn(7L);
        when(userService.findActiveByIdOrThrow(7L)).thenReturn(new User());
        when(subjectService.findActiveByIdOrThrow(1L)).thenReturn(subject());
        when(roomCodeService.generateUniqueRoomCode()).thenReturn("ABC123");
        when(raceRepository.save(any(Race.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        raceService = new RaceService(
                raceRepository,
                roomCodeService,
                currentUserService,
                userService,
                subjectService
        );
    }

    @ParameterizedTest
    @EnumSource(RaceFocusPolicy.class)
    void explicitFocusPolicyIsPersistedAndReturned(RaceFocusPolicy focusPolicy) {
        CreateRaceRequest request = request();
        request.setFocusPolicy(focusPolicy);

        RaceSummaryResponse response = raceService.createRace(request);

        assertEquals(focusPolicy, response.getFocusPolicy());
        org.mockito.Mockito.verify(raceRepository).save(
                org.mockito.ArgumentMatchers.argThat(
                        race -> race.getFocusPolicy() == focusPolicy
                )
        );
    }

    @Test
    void omittedFocusPolicyDefaultsToWarnInPersistenceAndResponse() {
        RaceSummaryResponse response = raceService.createRace(request());

        assertEquals(RaceFocusPolicy.WARN, response.getFocusPolicy());
        org.mockito.Mockito.verify(raceRepository).save(
                org.mockito.ArgumentMatchers.argThat(
                        race -> race.getFocusPolicy() == RaceFocusPolicy.WARN
                )
        );
    }

    private CreateRaceRequest request() {
        CreateRaceRequest request = new CreateRaceRequest();
        request.setTitle("Math Race");
        request.setSubjectId(1L);
        request.setMaxPlayers(8);
        request.setTotalDistance(1000);
        return request;
    }

    private Subject subject() {
        Subject subject = new Subject();
        subject.setId(1L);
        subject.setName("Math");
        subject.setCode("MATH");
        return subject;
    }
}
