package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.common.ChallengeApiPaths;
import com.quiz_wheelz.dto.raceplayer.StudentChallengeChoiceRequest;
import com.quiz_wheelz.dto.raceplayer.StudentChallengeChoiceResponse;
import com.quiz_wheelz.service.challenge.StudentChallengeChoiceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class StudentChallengeController {
    private final StudentChallengeChoiceService service;

    @PostMapping(ChallengeApiPaths.CHOICE)
    public ResponseEntity<ApiResponse<StudentChallengeChoiceResponse>> choose(
            HttpServletRequest request, @Valid @RequestBody StudentChallengeChoiceRequest body) {
        return ResponseEntity.ok(ApiResponse.ok(ApiMessages.CHALLENGE_CHOICE_SELECTED_SUCCESSFULLY,
                service.choose(request, body)));
    }
}
