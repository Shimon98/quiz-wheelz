package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceStateResponse;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.service.raceplayer.CurrentRacePlayerService;
import com.quiz_wheelz.service.raceplayer.RacePlayerJoinService;
import com.quiz_wheelz.service.raceplayer.StudentRaceStateService;
import com.quiz_wheelz.service.question.RacePlayerQuestionPlanService;
import com.quiz_wheelz.service.question.StudentAnswerSubmissionService;
import com.quiz_wheelz.service.question.StudentQuestionDeliveryService;
import com.quiz_wheelz.utils.CookieUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
    private RacePlayerQuestionPlanService racePlayerQuestionPlanService;

    @Mock
    private StudentQuestionDeliveryService studentQuestionDeliveryService;

    @Mock
    private StudentAnswerSubmissionService studentAnswerSubmissionService;

    @Mock
    private StudentRaceStateService studentRaceStateService;

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
        assertTrue(body.isSuccess());
        assertEquals(
                ApiMessages.STUDENT_RACE_STATE_LOADED_SUCCESSFULLY,
                body.getMessage()
        );
        assertSame(raceStateResponse, body.getData());
        assertEquals(RaceStatus.IN_PROGRESS, body.getData().getSnapshot().getRaceStatus());

        verify(studentRaceStateService).getRaceState(request);
    }

    private RacePlayerController createController() {
        return new RacePlayerController(
                racePlayerJoinService,
                cookieUtils,
                currentRacePlayerService,
                racePlayerQuestionPlanService,
                studentQuestionDeliveryService,
                studentAnswerSubmissionService,
                studentRaceStateService
        );
    }

    private StudentRaceStateResponse createRaceStateResponse() {
        return new StudentRaceStateResponse(
                1L,
                "Easy multiplication",
                "ABC123",
                LocalDateTime.of(2026, 7, 5, 10, 0),
                null,
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
                        false
                )
        );
    }
}
