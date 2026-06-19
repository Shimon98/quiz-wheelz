package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.teacher.TeacherDashboardResponse;
import com.quiz_wheelz.security.SecurityExpressions;
import com.quiz_wheelz.service.TeacherDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.TEACHER_DASHBOARD)
@PreAuthorize(SecurityExpressions.HAS_ROLE_TEACHER)
public class TeacherDashboardController {

    private final TeacherDashboardService teacherDashboardService;

    public TeacherDashboardController(TeacherDashboardService teacherDashboardService) {
        this.teacherDashboardService = teacherDashboardService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<TeacherDashboardResponse>> getDashboard() {
        TeacherDashboardResponse dashboard = teacherDashboardService.getDashboard();

        return ResponseEntity.ok(
                ApiResponse.ok(ApiMessages.TEACHER_DASHBOARD_LOADED_SUCCESSFULLY, dashboard)
        );
    }
}