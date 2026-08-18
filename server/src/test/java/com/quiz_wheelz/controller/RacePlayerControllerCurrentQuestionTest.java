package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.student.StudentQuestionChoiceResponse;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.RacePlayer;
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
import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerControllerCurrentQuestionTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-06-30T10:00:00Z");

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
    void shouldReturnCurrentStudentQuestionForCurrentRacePlayer() {
        RacePlayer racePlayer = new RacePlayer();
        StudentQuestionResponse questionResponse = createStudentQuestionResponse();

        when(currentRacePlayerService.resolveCurrentRacePlayer(request)).thenReturn(racePlayer);
        when(studentQuestionDeliveryService.getOrCreateCurrentQuestion(racePlayer))
                .thenReturn(questionResponse);

        ResponseEntity<ApiResponse<StudentQuestionResponse>> response =
                createController().getCurrentQuestion(request);

        ApiResponse<StudentQuestionResponse> body = response.getBody();

        assertEquals(200, response.getStatusCode().value());
        assertTrue(body.isSuccess());
        assertEquals(
                ApiMessages.CURRENT_STUDENT_QUESTION_LOADED_SUCCESSFULLY,
                body.getMessage()
        );
        assertSame(questionResponse, body.getData());

        verify(currentRacePlayerService).resolveCurrentRacePlayer(request);
        verify(studentQuestionDeliveryService).getOrCreateCurrentQuestion(racePlayer);
    }

    @Test
    void currentQuestionOperationShouldBePostOnTheSamePath() throws NoSuchMethodException {
        // The operation can expire/create questions — it is a POST resolve,
        // never a safe GET (C1-02K).
        Method endpoint = RacePlayerController.class.getMethod(
                "getCurrentQuestion",
                HttpServletRequest.class
        );

        PostMapping postMapping = endpoint.getAnnotation(PostMapping.class);

        assertNotNull(postMapping);
        assertEquals(ApiPaths.CURRENT_QUESTION, postMapping.value()[0]);
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

    private StudentQuestionResponse createStudentQuestionResponse() {
        return new StudentQuestionResponse(
                1L,
                "6 + 6 = ?",
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                FIXED_INSTANT.toEpochMilli(),
                FIXED_INSTANT.plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS).toEpochMilli(),
                List.of(
                        new StudentQuestionChoiceResponse(1L, "12", 1),
                        new StudentQuestionChoiceResponse(2L, "10", 2)
                )
        );
    }
}
