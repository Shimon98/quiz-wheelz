package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerFocusEventRequest;
import com.quiz_wheelz.dto.raceplayer.RacePlayerFocusEventResponse;
import com.quiz_wheelz.service.raceplayer.RacePlayerFocusEventService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Objects;

@RestController
@RequestMapping(ApiPaths.RACE_PLAYERS)
public class RacePlayerFocusEventController {

    private final RacePlayerFocusEventService focusEventService;

    public RacePlayerFocusEventController(
            RacePlayerFocusEventService focusEventService
    ) {
        this.focusEventService = Objects.requireNonNull(focusEventService);
    }

    @PostMapping(ApiPaths.CURRENT_FOCUS_EVENTS)
    public ResponseEntity<ApiResponse<RacePlayerFocusEventResponse>> recordFocusEvent(
            HttpServletRequest httpRequest,
            @Valid @RequestBody RacePlayerFocusEventRequest request
    ) {
        RacePlayerFocusEventResponse response =
                focusEventService.recordFocusEvent(httpRequest, request);

        return ResponseEntity.ok(
                ApiResponse.ok(
                        ApiMessages.RACE_PLAYER_FOCUS_EVENT_RECORDED_SUCCESSFULLY,
                        response
                )
        );
    }
}
