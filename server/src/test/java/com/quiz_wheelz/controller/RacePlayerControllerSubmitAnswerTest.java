package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.answer.StudentAnswerRaceImpactResponse;
import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.dto.answer.SubmitAnswerResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceRuntimeSnapshotResponse;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.PlayerQuestionStatus;
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
import org.springframework.web.bind.annotation.PostMapping;

import java.lang.reflect.Method;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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
    void shouldSubmitAnswerForCurrentRacePlayer() {
        RacePlayer racePlayer = new RacePlayer();
        SubmitAnswerRequest submitAnswerRequest = createSubmitAnswerRequest();
        StudentAnswerRaceImpactResponse raceImpact = new StudentAnswerRaceImpactResponse(
                0,
                0.0,
                false,
                new StudentRaceRuntimeSnapshotResponse(
                        1000,
                        0,
                        0.0,
                        0.8,
                        0,
                        0,
                        Difficulty.EASY,
                        RacePlayerStatus.RACING,
                        RaceStatus.IN_PROGRESS,
                        false,
                        false,
                        1_787_045_370_000L,
                        3.2
                )
        );
        SubmitAnswerResponse answerResponse = new SubmitAnswerResponse(
                10L,
                101L,
                false,
                102L,
                PlayerQuestionStatus.ANSWERED.name(),
                1_787_045_370_000L,
                1_787_045_400_000L,
                raceImpact
        );

        when(currentRacePlayerService.resolveCurrentRacePlayer(request)).thenReturn(racePlayer);
        when(studentAnswerSubmissionService.submitAnswer(racePlayer, submitAnswerRequest))
                .thenReturn(answerResponse);

        ResponseEntity<ApiResponse<SubmitAnswerResponse>> response =
                createController().submitAnswer(request, submitAnswerRequest);

        ApiResponse<SubmitAnswerResponse> body = response.getBody();

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(body);
        assertTrue(body.isSuccess());
        assertEquals(
                ApiMessages.STUDENT_ANSWER_SUBMITTED_SUCCESSFULLY,
                body.getMessage()
        );
        assertSame(answerResponse, body.getData());
        assertFalse(body.getData().isCorrect());
        assertEquals(102L, body.getData().getCorrectAnswerChoiceId());
        assertEquals(0, body.getData().getRaceImpact().getScoreDelta());
        assertEquals(
                RacePlayerStatus.RACING,
                body.getData().getRaceImpact().getSnapshot().getPlayerStatus()
        );

        verify(currentRacePlayerService).resolveCurrentRacePlayer(request);
        verify(studentAnswerSubmissionService).submitAnswer(
                racePlayer,
                submitAnswerRequest
        );
    }

    @Test
    void submitAnswerOperationShouldBePostOnTheSubmitAnswerPath() throws NoSuchMethodException {
        Method endpoint = RacePlayerController.class.getMethod(
                "submitAnswer",
                HttpServletRequest.class,
                SubmitAnswerRequest.class
        );
        PostMapping postMapping = endpoint.getAnnotation(PostMapping.class);

        assertNotNull(postMapping);
        assertEquals(ApiPaths.SUBMIT_ANSWER, postMapping.value()[0]);
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

    private SubmitAnswerRequest createSubmitAnswerRequest() {
        SubmitAnswerRequest request = new SubmitAnswerRequest();
        request.setQuestionId(10L);
        request.setChoiceId(101L);

        return request;
    }
}
