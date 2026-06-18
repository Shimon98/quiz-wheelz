package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.race.CreateRaceRequest;
import com.quiz_wheelz.dto.race.RaceSummaryResponse;
import com.quiz_wheelz.service.RaceService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teacher/races")
@PreAuthorize("hasRole('TEACHER')")
public class TeacherRaceController {

    private final RaceService raceService;

    public TeacherRaceController(RaceService raceService) {
        this.raceService = raceService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RaceSummaryResponse>> createRace(
            @Valid @RequestBody CreateRaceRequest request
    ) {
        RaceSummaryResponse race = raceService.createRace(request);

        return ResponseEntity.ok(
                ApiResponse.ok("Race created successfully", race)
        );
    }
}