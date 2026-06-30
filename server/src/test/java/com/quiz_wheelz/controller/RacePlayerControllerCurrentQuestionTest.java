package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.common.QuestionRules;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.dto.question.student.StudentQuestionChoiceResponse;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.entitys.Subject;
import com.quiz_wheelz.enums.AdaptiveMode;
import com.quiz_wheelz.enums.AssistanceLevel;
import com.quiz_wheelz.enums.Difficulty;
import com.quiz_wheelz.enums.QuestionGenerationPattern;
import com.quiz_wheelz.enums.QuestionType;
import com.quiz_wheelz.service.CurrentRacePlayerService;
import com.quiz_wheelz.service.RacePlayerJoinService;
import com.quiz_wheelz.service.question.RacePlayerQuestionPlanService;
import com.quiz_wheelz.service.question.StudentQuestionDeliveryService;
import com.quiz_wheelz.utils.CookieUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerControllerCurrentQuestionTest {

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
    private HttpServletRequest request;

    @Test
    void shouldReturnCurrentStudentQuestionForCurrentRacePlayer() {
        RacePlayer racePlayer = new RacePlayer();
        QuestionPlan questionPlan = createQuestionPlan();
        StudentQuestionResponse questionResponse = createStudentQuestionResponse();

        when(currentRacePlayerService.resolveCurrentRacePlayer(request)).thenReturn(racePlayer);
        when(racePlayerQuestionPlanService.buildQuestionPlan(racePlayer)).thenReturn(questionPlan);
        when(studentQuestionDeliveryService.getOrCreateCurrentQuestion(racePlayer, questionPlan))
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
        verify(racePlayerQuestionPlanService).buildQuestionPlan(racePlayer);
        verify(studentQuestionDeliveryService).getOrCreateCurrentQuestion(
                racePlayer,
                questionPlan
        );
    }

    private RacePlayerController createController() {
        return new RacePlayerController(
                racePlayerJoinService,
                cookieUtils,
                currentRacePlayerService,
                racePlayerQuestionPlanService,
                studentQuestionDeliveryService
        );
    }

    private QuestionPlan createQuestionPlan() {
        Subject subject = new Subject();
        subject.setCode(QuestionRules.DEFAULT_SUBJECT_CODE);
        subject.setName("Math");
        subject.setActive(true);

        return new QuestionPlan(
                subject,
                QuestionType.ADDITION,
                Difficulty.EASY,
                1,
                10,
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                QuestionRules.DEFAULT_CHOICES_COUNT,
                QuestionGenerationPattern.BINARY_OPERATION,
                AdaptiveMode.BASIC,
                AssistanceLevel.NONE
        );
    }

    private StudentQuestionResponse createStudentQuestionResponse() {
        return new StudentQuestionResponse(
                1L,
                "6 + 6 = ?",
                QuestionRules.DEFAULT_TIME_LIMIT_SECONDS,
                LocalDateTime.now().plusSeconds(QuestionRules.DEFAULT_TIME_LIMIT_SECONDS),
                List.of(
                        new StudentQuestionChoiceResponse(1L, "12", 1),
                        new StudentQuestionChoiceResponse(2L, "10", 2)
                )
        );
    }
}
