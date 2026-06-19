package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.race.CreateRaceRequest;
import com.quiz_wheelz.dto.race.RaceSummaryResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceRoomResponse;
import com.quiz_wheelz.security.SecurityExpressions;
import com.quiz_wheelz.service.RaceService;
import com.quiz_wheelz.service.TeacherRaceRoomService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiPaths.TEACHER_RACES)
@PreAuthorize(SecurityExpressions.HAS_ROLE_TEACHER)
public class TeacherRaceController {

    private final RaceService raceService;
    private final TeacherRaceRoomService teacherRaceRoomService;

    public TeacherRaceController(
            RaceService raceService,
            TeacherRaceRoomService teacherRaceRoomService
    ) {
        this.raceService = raceService;
        this.teacherRaceRoomService = teacherRaceRoomService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RaceSummaryResponse>> createRace(
            @Valid @RequestBody CreateRaceRequest request
    ) {
        RaceSummaryResponse race = raceService.createRace(request);

        return ResponseEntity.ok(
                ApiResponse.ok(ApiMessages.RACE_CREATED_SUCCESSFULLY, race)
        );
    }

    @GetMapping(ApiPaths.TEACHER_RACE_ROOM)
    public ResponseEntity<ApiResponse<TeacherRaceRoomResponse>> getRaceRoom(
            @PathVariable Long raceId
    ) {
        TeacherRaceRoomResponse raceRoom = teacherRaceRoomService.getRaceRoom(raceId);

        return ResponseEntity.ok(
                ApiResponse.ok(ApiMessages.RACE_ROOM_LOADED_SUCCESSFULLY, raceRoom)
        );
    }
}