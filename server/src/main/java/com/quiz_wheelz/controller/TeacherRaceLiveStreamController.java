package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.RaceLiveStreamRules;
import com.quiz_wheelz.security.SecurityExpressions;
import com.quiz_wheelz.service.teacher.TeacherRaceLiveStreamService;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Objects;

@RestController
@RequestMapping(ApiPaths.TEACHER_RACES)
@PreAuthorize(SecurityExpressions.HAS_ROLE_TEACHER)
public class TeacherRaceLiveStreamController {

    private final TeacherRaceLiveStreamService streamService;

    public TeacherRaceLiveStreamController(TeacherRaceLiveStreamService streamService) {
        this.streamService = Objects.requireNonNull(streamService);
    }

    @GetMapping(
            value = ApiPaths.TEACHER_RACE_EVENTS_STREAM,
            produces = MediaType.TEXT_EVENT_STREAM_VALUE
    )
    public SseEmitter stream(
            @PathVariable Long raceId,
            @RequestParam(
                    name = RaceLiveStreamRules.AFTER_VERSION_PARAMETER,
                    required = false
            ) String afterVersion,
            @RequestHeader(
                    name = RaceLiveStreamRules.LAST_EVENT_ID_HEADER,
                    required = false
            ) String lastEventId
    ) {
        return streamService.connect(raceId, afterVersion, lastEventId);
    }
}
