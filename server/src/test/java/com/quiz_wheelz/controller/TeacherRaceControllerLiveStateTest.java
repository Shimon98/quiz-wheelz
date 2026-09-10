package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceLiveStateResponse;
import com.quiz_wheelz.enums.RaceFocusPolicy;
import com.quiz_wheelz.security.SecurityExpressions;
import com.quiz_wheelz.service.race.RaceService;
import com.quiz_wheelz.service.teacher.TeacherRaceLiveStateService;
import com.quiz_wheelz.service.teacher.TeacherRaceRoomService;
import com.quiz_wheelz.service.teacher.TeacherRaceStartService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeacherRaceControllerLiveStateTest {

    @Mock
    private RaceService raceService;

    @Mock
    private TeacherRaceRoomService teacherRaceRoomService;

    @Mock
    private TeacherRaceStartService teacherRaceStartService;

    @Mock
    private TeacherRaceLiveStateService teacherRaceLiveStateService;

    @Test
    void controllerReturnsTheTeacherLiveStateEnvelope() {
        TeacherRaceLiveStateResponse liveState = new TeacherRaceLiveStateResponse(
                12L,
                "Math Race",
                "ABC123",
                "IN_PROGRESS",
                1000,
                RaceFocusPolicy.WARN,
                1_787_568_000_000L,
                4.0,
                0L,
                List.of()
        );
        when(teacherRaceLiveStateService.getLiveState(12L)).thenReturn(liveState);

        ResponseEntity<ApiResponse<TeacherRaceLiveStateResponse>> response =
                controller().getRaceLiveState(12L);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(
                ApiMessages.RACE_LIVE_STATE_LOADED_SUCCESSFULLY,
                response.getBody().getMessage()
        );
        assertSame(liveState, response.getBody().getData());
        verify(teacherRaceLiveStateService).getLiveState(12L);
    }

    @Test
    void endpointUsesTheCentralTeacherLiveStatePath() throws NoSuchMethodException {
        RequestMapping baseMapping = TeacherRaceController.class.getAnnotation(
                RequestMapping.class
        );
        Method endpoint = TeacherRaceController.class.getMethod(
                "getRaceLiveState",
                Long.class
        );
        GetMapping getMapping = endpoint.getAnnotation(GetMapping.class);

        assertNotNull(baseMapping);
        assertEquals(ApiPaths.TEACHER_RACES, baseMapping.value()[0]);
        assertNotNull(getMapping);
        assertEquals(ApiPaths.TEACHER_RACE_LIVE_STATE, getMapping.value()[0]);
    }

    @Test
    void controllerRetainsTeacherRoleSecurity() {
        PreAuthorize preAuthorize = TeacherRaceController.class.getAnnotation(
                PreAuthorize.class
        );

        assertNotNull(preAuthorize);
        assertEquals(SecurityExpressions.HAS_ROLE_TEACHER, preAuthorize.value());
    }

    private TeacherRaceController controller() {
        return new TeacherRaceController(
                raceService,
                teacherRaceRoomService,
                teacherRaceStartService,
                teacherRaceLiveStateService
        );
    }
}
