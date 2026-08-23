package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRacePlayerPresentationResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceStateResponse;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.service.raceplayer.CurrentRacePlayerService;
import com.quiz_wheelz.service.raceplayer.RacePlayerJoinService;
import com.quiz_wheelz.service.raceplayer.RacePlayerRuntimeSessionService;
import com.quiz_wheelz.service.raceplayer.StudentRaceStateService;
import com.quiz_wheelz.service.question.StudentAnswerSubmissionService;
import com.quiz_wheelz.service.question.StudentQuestionDeliveryService;
import com.quiz_wheelz.utils.CookieUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerControllerRaceStateTest {

    @Mock
    private RacePlayerJoinService racePlayerJoinService;

    @Mock
    private CookieUtils cookieUtils;

    @Mock
    private CurrentRacePlayerService currentRacePlayerService;

    @Mock
    private StudentQuestionDeliveryService studentQuestionDeliveryService;

    @Mock
    private StudentAnswerSubmissionService studentAnswerSubmissionService;

    @Mock
    private StudentRaceStateService studentRaceStateService;

    @Mock
    private RacePlayerRuntimeSessionService racePlayerRuntimeSessionService;

    @Mock
    private HttpServletRequest request;

    @Test
    void shouldReturnRaceStateForCurrentRacePlayerSession() {
        StudentRaceStateResponse raceStateResponse = createRaceStateResponse();

        when(studentRaceStateService.getRaceState(request)).thenReturn(raceStateResponse);

        ResponseEntity<ApiResponse<StudentRaceStateResponse>> response =
                createController().getRaceState(request);

        ApiResponse<StudentRaceStateResponse> body = response.getBody();

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(body);
        assertTrue(body.isSuccess());
        assertEquals(
                ApiMessages.STUDENT_RACE_STATE_LOADED_SUCCESSFULLY,
                body.getMessage()
        );
        assertSame(raceStateResponse, body.getData());
        assertEquals(RaceStatus.IN_PROGRESS, body.getData().getSnapshot().getRaceStatus());

        verify(studentRaceStateService).getRaceState(request);
    }

    @Test
    void raceStateOperationShouldBeGetOnTheCurrentRaceStatePath() throws NoSuchMethodException {
        RequestMapping baseMapping = RacePlayerController.class.getAnnotation(RequestMapping.class);
        Method endpoint = RacePlayerController.class.getMethod(
                "getRaceState",
                HttpServletRequest.class
        );
        GetMapping getMapping = endpoint.getAnnotation(GetMapping.class);

        assertNotNull(baseMapping);
        assertEquals(ApiPaths.RACE_PLAYERS, baseMapping.value()[0]);
        assertNotNull(getMapping);
        assertEquals(ApiPaths.CURRENT_RACE_STATE, getMapping.value()[0]);
    }

    private RacePlayerController createController() {
        return new RacePlayerController(
                racePlayerJoinService,
                cookieUtils,
                currentRacePlayerService,
                studentQuestionDeliveryService,
                studentAnswerSubmissionService,
                studentRaceStateService,
                racePlayerRuntimeSessionService
        );
    }

    private StudentRaceStateResponse createRaceStateResponse() {
        return new StudentRaceStateResponse(
                1L,
                "Easy multiplication",
                "ABC123",
                LocalDateTime.of(2026, 7, 5, 10, 0),
                null,
                new StudentRacePlayerPresentationResponse(
                        9L,
                        "Noa",
                        3,
                        "HOVER_KART",
                        "GREEN",
                        "HOVER_KART_GREEN"
                ),
                new StudentRaceRuntimeSnapshotResponse(
                        1000,
                        50,
                        120.0,
                        1.2,
                        3,
                        5,
                        Difficulty.EASY,
                        RacePlayerStatus.RACING,
                        RaceStatus.IN_PROGRESS,
                        false,
                        false,
                        1_787_045_370_000L,
                        4.8,
                        1,
                        1,
                        List.of()
                )
        );
    }
}
