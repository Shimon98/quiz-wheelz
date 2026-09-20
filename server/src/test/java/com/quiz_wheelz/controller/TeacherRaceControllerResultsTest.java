package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.subject.SubjectResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceResultsResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceResultsSummaryResponse;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.exception.GlobalExceptionHandler;
import com.quiz_wheelz.security.SecurityExpressions;
import com.quiz_wheelz.service.race.RaceService;
import com.quiz_wheelz.service.teacher.TeacherRaceLiveStateService;
import com.quiz_wheelz.service.teacher.TeacherRaceRoomService;
import com.quiz_wheelz.service.teacher.TeacherRaceResultsService;
import com.quiz_wheelz.service.teacher.TeacherRaceStartService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TeacherRaceControllerResultsTest {

    @Mock
    private RaceService raceService;

    @Mock
    private TeacherRaceRoomService teacherRaceRoomService;

    @Mock
    private TeacherRaceStartService teacherRaceStartService;

    @Mock
    private TeacherRaceLiveStateService teacherRaceLiveStateService;

    @Mock
    private TeacherRaceResultsService teacherRaceResultsService;

    @Test
    void controllerReturnsTheTeacherResultsEnvelope() {
        TeacherRaceResultsResponse results = response();
        when(teacherRaceResultsService.getResults(12L)).thenReturn(results);

        ResponseEntity<ApiResponse<TeacherRaceResultsResponse>> response =
                controller().getRaceResults(12L);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(ApiMessages.RACE_RESULTS_LOADED_SUCCESSFULLY, response.getBody().getMessage());
        assertSame(results, response.getBody().getData());
        verify(teacherRaceResultsService).getResults(12L);
    }

    @Test
    void missingRaceReturnsCanonicalHiddenNotFoundResponse() throws Exception {
        when(teacherRaceResultsService.getResults(404L))
                .thenThrow(new ApiException(ErrorCode.RACE_NOT_FOUND));

        mockMvc().perform(get(ApiPaths.TEACHER_RACES + "/404/results"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(3004))
                .andExpect(jsonPath("$.error").value("RACE_NOT_FOUND"));
    }

    @Test
    void foreignRaceReturnsCanonicalHiddenNotFoundResponse() throws Exception {
        when(teacherRaceResultsService.getResults(91L))
                .thenThrow(new ApiException(ErrorCode.RACE_NOT_FOUND));

        mockMvc().perform(get(ApiPaths.TEACHER_RACES + "/91/results"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(3004))
                .andExpect(jsonPath("$.error").value("RACE_NOT_FOUND"));
    }

    @Test
    void unfinishedRaceReturnsResultsNotAvailableConflict() throws Exception {
        when(teacherRaceResultsService.getResults(12L))
                .thenThrow(new ApiException(ErrorCode.RACE_RESULTS_NOT_AVAILABLE));

        mockMvc().perform(get(ApiPaths.TEACHER_RACES + "/12/results"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(3030))
                .andExpect(jsonPath("$.error").value("RACE_RESULTS_NOT_AVAILABLE"))
                .andExpect(jsonPath("$.message").value(
                        "Race results are not available until the race is finished"
                ));
    }

    @Test
    void endpointUsesCanonicalGetPathAndTeacherSecurity() throws NoSuchMethodException {
        RequestMapping baseMapping = TeacherRaceController.class.getAnnotation(RequestMapping.class);
        PreAuthorize authorization = TeacherRaceController.class.getAnnotation(PreAuthorize.class);
        Method endpoint = TeacherRaceController.class.getMethod("getRaceResults", Long.class);
        GetMapping getMapping = endpoint.getAnnotation(GetMapping.class);

        assertEquals(ApiPaths.TEACHER_RACES, baseMapping.value()[0]);
        assertEquals(ApiPaths.TEACHER_RACE_RESULTS, getMapping.value()[0]);
        assertEquals(SecurityExpressions.HAS_ROLE_TEACHER, authorization.value());
    }

    private MockMvc mockMvc() {
        return MockMvcBuilders.standaloneSetup(controller())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    private TeacherRaceController controller() {
        return new TeacherRaceController(
                raceService,
                teacherRaceRoomService,
                teacherRaceStartService,
                teacherRaceLiveStateService,
                teacherRaceResultsService
        );
    }

    private TeacherRaceResultsResponse response() {
        return new TeacherRaceResultsResponse(
                12L,
                "Math Race",
                "ABC123",
                new SubjectResponse(3L, "Mathematics", "MATH"),
                "FINISHED",
                8,
                0,
                1000,
                1L,
                2L,
                List.of(),
                new TeacherRaceResultsSummaryResponse(0, 0, 0, 0),
                List.of(),
                List.of()
        );
    }
}
