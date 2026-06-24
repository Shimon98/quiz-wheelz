package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.subject.SubjectResponse;
import com.quiz_wheelz.security.SecurityExpressions;
import com.quiz_wheelz.service.SubjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(ApiPaths.SUBJECTS)
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    @PreAuthorize(SecurityExpressions.HAS_ANY_ROLE_TEACHER_ADMIN)
    public ResponseEntity<ApiResponse<List<SubjectResponse>>> getActiveSubjects() {
        List<SubjectResponse> subjects = subjectService.getActiveSubjects();

        return ResponseEntity.ok(
                ApiResponse.ok(ApiMessages.ACTIVE_SUBJECTS_LOADED, subjects)
        );
    }
}
