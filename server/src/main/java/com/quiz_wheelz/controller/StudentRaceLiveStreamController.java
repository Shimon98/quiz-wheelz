package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.RaceLiveStreamRules;
import com.quiz_wheelz.service.raceplayer.StudentRaceLiveStreamService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Objects;

@RestController
public class StudentRaceLiveStreamController {

    private final StudentRaceLiveStreamService streamService;

    public StudentRaceLiveStreamController(StudentRaceLiveStreamService streamService) {
        this.streamService = Objects.requireNonNull(streamService);
    }

    @GetMapping(value = ApiPaths.RACE_PLAYERS_EVENTS_STREAM, produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            HttpServletRequest request,
            @RequestParam(name = RaceLiveStreamRules.AFTER_VERSION_PARAMETER, required = false)
            String afterVersion,
            @RequestHeader(name = RaceLiveStreamRules.LAST_EVENT_ID_HEADER, required = false)
            String lastEventId
    ) {
        return streamService.connect(request, afterVersion, lastEventId);
    }
}
