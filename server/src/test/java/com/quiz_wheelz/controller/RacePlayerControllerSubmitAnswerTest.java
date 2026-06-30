package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.dto.answer.SubmitAnswerResponse;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
import com.quiz_wheelz.service.raceplayer.CurrentRacePlayerService;
import com.quiz_wheelz.service.raceplayer.RacePlayerJoinService;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerControllerSubmitAnswerTest {

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
    private HttpServletRequest request;

    @Test
    void shouldSubmitAnswerForCurrentRacePlayer() {
        RacePlayer racePlayer = new RacePlayer();
        SubmitAnswerRequest submitAnswerRequest = createSubmitAnswerRequest();
        SubmitAnswerResponse answerResponse = new SubmitAnswerResponse(
                10L,
                101L,
                false,
                102L,
                PlayerQuestionStatus.ANSWERED.name(),
                LocalDateTime.now(),
                LocalDateTime.now().plusSeconds(30)
        );

        when(currentRacePlayerService.resolveCurrentRacePlayer(request)).thenReturn(racePlayer);
        when(studentAnswerSubmissionService.submitAnswer(racePlayer, submitAnswerRequest))
                .thenReturn(answerResponse);

        ResponseEntity<ApiResponse<SubmitAnswerResponse>> response =
                createController().submitAnswer(request, submitAnswerRequest);

        ApiResponse<SubmitAnswerResponse> body = response.getBody();

        assertEquals(200, response.getStatusCode().value());
        assertTrue(body.isSuccess());
        assertEquals(
                ApiMessages.STUDENT_ANSWER_SUBMITTED_SUCCESSFULLY,
                body.getMessage()
        );
        assertSame(answerResponse, body.getData());
        assertFalse(body.getData().isCorrect());
        assertEquals(102L, body.getData().getCorrectAnswerChoiceId());

        verify(currentRacePlayerService).resolveCurrentRacePlayer(request);
        verify(studentAnswerSubmissionService).submitAnswer(
                racePlayer,
                submitAnswerRequest
        );
    }

    private RacePlayerController createController() {
        return new RacePlayerController(
                racePlayerJoinService,
                cookieUtils,
                currentRacePlayerService,
                racePlayerQuestionPlanService,
                studentQuestionDeliveryService,
                studentAnswerSubmissionService
        );
    }

    private SubmitAnswerRequest createSubmitAnswerRequest() {
        SubmitAnswerRequest request = new SubmitAnswerRequest();
        request.setQuestionId(10L);
        request.setChoiceId(101L);

        return request;
    }
}
