package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.answer.SubmitAnswerRequest;
import com.quiz_wheelz.dto.answer.SubmitAnswerResponse;
import com.quiz_wheelz.dto.question.QuestionPlan;
import com.quiz_wheelz.dto.question.student.StudentQuestionResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerJoinRequest;
import com.quiz_wheelz.dto.raceplayer.RacePlayerJoinResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerJoinResult;
import com.quiz_wheelz.entitys.RacePlayer;
import com.quiz_wheelz.service.CurrentRacePlayerService;
import com.quiz_wheelz.service.RacePlayerJoinService;
import com.quiz_wheelz.service.question.RacePlayerQuestionPlanService;
import com.quiz_wheelz.service.question.StudentAnswerSubmissionService;
import com.quiz_wheelz.service.question.StudentQuestionDeliveryService;
import com.quiz_wheelz.utils.CookieUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.RACE_PLAYERS)
public class RacePlayerController {

    private final RacePlayerJoinService racePlayerJoinService;
    private final CookieUtils cookieUtils;
    private final CurrentRacePlayerService currentRacePlayerService;
    private final RacePlayerQuestionPlanService racePlayerQuestionPlanService;
    private final StudentQuestionDeliveryService studentQuestionDeliveryService;
    private final StudentAnswerSubmissionService studentAnswerSubmissionService;

    public RacePlayerController(
            RacePlayerJoinService racePlayerJoinService,
            CookieUtils cookieUtils,
            CurrentRacePlayerService currentRacePlayerService,
            RacePlayerQuestionPlanService racePlayerQuestionPlanService,
            StudentQuestionDeliveryService studentQuestionDeliveryService,
            StudentAnswerSubmissionService studentAnswerSubmissionService
    ) {
        this.racePlayerJoinService = racePlayerJoinService;
        this.cookieUtils = cookieUtils;
        this.currentRacePlayerService = currentRacePlayerService;
        this.racePlayerQuestionPlanService = racePlayerQuestionPlanService;
        this.studentQuestionDeliveryService = studentQuestionDeliveryService;
        this.studentAnswerSubmissionService = studentAnswerSubmissionService;
    }

    @PostMapping(ApiPaths.JOIN)
    public ResponseEntity<ApiResponse<RacePlayerJoinResponse>> joinRace(
            @Valid @RequestBody RacePlayerJoinRequest request,
            HttpServletResponse response
    ) {
        RacePlayerJoinResult result = racePlayerJoinService.joinRace(request);
        cookieUtils.addRacePlayerCookie(response, result.getRacePlayerToken());

        return ResponseEntity.ok(
                ApiResponse.ok(
                        ApiMessages.RACE_PLAYER_JOINED_SUCCESSFULLY,
                        result.getResponse()
                )
        );
    }

    @GetMapping(ApiPaths.CURRENT_QUESTION)
    public ResponseEntity<ApiResponse<StudentQuestionResponse>> getCurrentQuestion(
            HttpServletRequest request
    ) {
        RacePlayer racePlayer = currentRacePlayerService.resolveCurrentRacePlayer(request);

        QuestionPlan questionPlan = racePlayerQuestionPlanService.buildQuestionPlan(racePlayer);

        StudentQuestionResponse response =
                studentQuestionDeliveryService.getOrCreateCurrentQuestion(
                        racePlayer,
                        questionPlan
                );

        return ResponseEntity.ok(
                ApiResponse.ok(
                        ApiMessages.CURRENT_STUDENT_QUESTION_LOADED_SUCCESSFULLY,
                        response
                )
        );
    }

    @PostMapping(ApiPaths.SUBMIT_ANSWER)
    public ResponseEntity<ApiResponse<SubmitAnswerResponse>> submitAnswer(
            HttpServletRequest request,
            @Valid @RequestBody SubmitAnswerRequest submitAnswerRequest
    ) {
        RacePlayer racePlayer = currentRacePlayerService.resolveCurrentRacePlayer(request);

        SubmitAnswerResponse response =
                studentAnswerSubmissionService.submitAnswer(
                        racePlayer,
                        submitAnswerRequest
                );

        return ResponseEntity.ok(
                ApiResponse.ok(
                        ApiMessages.STUDENT_ANSWER_SUBMITTED_SUCCESSFULLY,
                        response
                )
        );
    }
}
