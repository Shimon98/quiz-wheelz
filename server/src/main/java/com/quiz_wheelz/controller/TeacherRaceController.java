package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.race.CreateRaceRequest;
import com.quiz_wheelz.dto.race.RaceSummaryResponse;
import com.quiz_wheelz.dto.teacher.StartRaceResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceLiveStateResponse;
import com.quiz_wheelz.dto.teacher.TeacherRaceRoomResponse;
import com.quiz_wheelz.security.SecurityExpressions;
import com.quiz_wheelz.service.race.RaceService;
import com.quiz_wheelz.service.teacher.TeacherRaceLiveStateService;
import com.quiz_wheelz.service.teacher.TeacherRaceRoomService;
import com.quiz_wheelz.service.teacher.TeacherRaceStartService;
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
    private final TeacherRaceStartService teacherRaceStartService;
    private final TeacherRaceLiveStateService teacherRaceLiveStateService;

    public TeacherRaceController(
            RaceService raceService,
            TeacherRaceRoomService teacherRaceRoomService,
            TeacherRaceStartService teacherRaceStartService,
            TeacherRaceLiveStateService teacherRaceLiveStateService
    ) {
        this.raceService = raceService;
        this.teacherRaceRoomService = teacherRaceRoomService;
        this.teacherRaceStartService = teacherRaceStartService;
        this.teacherRaceLiveStateService = teacherRaceLiveStateService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RaceSummaryResponse>> createRace(
            @Valid @RequestBody CreateRaceRequest request
    ) {
        RaceSummaryResponse race = raceService.createRace(request);
        return ResponseEntity.ok(ApiResponse.ok(ApiMessages.RACE_CREATED_SUCCESSFULLY, race));
    }

    @GetMapping(ApiPaths.TEACHER_RACE_ROOM)
    public ResponseEntity<ApiResponse<TeacherRaceRoomResponse>> getRaceRoom(
            @PathVariable Long raceId
    ) {
        TeacherRaceRoomResponse raceRoom = teacherRaceRoomService.getRaceRoom(raceId);
        return ResponseEntity.ok(ApiResponse.ok(ApiMessages.RACE_ROOM_LOADED_SUCCESSFULLY, raceRoom));
    }

    @GetMapping(ApiPaths.TEACHER_RACE_LIVE_STATE)
    public ResponseEntity<ApiResponse<TeacherRaceLiveStateResponse>> getRaceLiveState(
            @PathVariable Long raceId
    ) {
        TeacherRaceLiveStateResponse liveState =
                teacherRaceLiveStateService.getLiveState(raceId);
        return ResponseEntity.ok(
                ApiResponse.ok(ApiMessages.RACE_LIVE_STATE_LOADED_SUCCESSFULLY, liveState)
        );
    }

    @PostMapping(ApiPaths.TEACHER_RACE_START)
    public ResponseEntity<ApiResponse<StartRaceResponse>> startRace(
            @PathVariable Long raceId
    ) {
        StartRaceResponse startedRace = teacherRaceStartService.startRace(raceId);
        return ResponseEntity.ok(ApiResponse.ok(ApiMessages.RACE_STARTED_SUCCESSFULLY, startedRace));
    }
}
