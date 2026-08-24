package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerFocusEventRequest;
import com.quiz_wheelz.dto.raceplayer.RacePlayerFocusEventResponse;
import com.quiz_wheelz.enums.RacePlayerFocusEventOutcome;
import com.quiz_wheelz.enums.RacePlayerFocusEventType;
import com.quiz_wheelz.service.raceplayer.RacePlayerFocusEventService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.lang.reflect.Method;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerFocusEventControllerTest {

    private static final UUID EVENT_ID =
            UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

    @Mock
    private RacePlayerFocusEventService focusEventService;

    @Mock
    private HttpServletRequest httpRequest;

    @Test
    void recordFocusEventDelegatesAndReturnsProjectStandardResponse() {
        RacePlayerFocusEventRequest request = request();
        RacePlayerFocusEventResponse serviceResponse =
                new RacePlayerFocusEventResponse(
                        EVENT_ID,
                        RacePlayerFocusEventType.TAB_HIDDEN,
                        RacePlayerFocusEventOutcome.WARNING,
                        1,
                        1,
                        42L,
                        1787500000000L
                );
        when(focusEventService.recordFocusEvent(httpRequest, request))
                .thenReturn(serviceResponse);

        ResponseEntity<ApiResponse<RacePlayerFocusEventResponse>> response =
                new RacePlayerFocusEventController(focusEventService)
                        .recordFocusEvent(httpRequest, request);

        ApiResponse<RacePlayerFocusEventResponse> body = response.getBody();
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(body);
        assertTrue(body.isSuccess());
        assertEquals(
                ApiMessages.RACE_PLAYER_FOCUS_EVENT_RECORDED_SUCCESSFULLY,
                body.getMessage()
        );
        assertSame(serviceResponse, body.getData());
        verify(focusEventService).recordFocusEvent(httpRequest, request);
    }

    @Test
    void endpointUsesPostOnCanonicalCurrentPlayerPath() throws NoSuchMethodException {
        RequestMapping controllerMapping = RacePlayerFocusEventController.class
                .getAnnotation(RequestMapping.class);
        Method endpoint = RacePlayerFocusEventController.class.getMethod(
                "recordFocusEvent",
                HttpServletRequest.class,
                RacePlayerFocusEventRequest.class
        );
        PostMapping postMapping = endpoint.getAnnotation(PostMapping.class);

        assertNotNull(controllerMapping);
        assertEquals(ApiPaths.RACE_PLAYERS, controllerMapping.value()[0]);
        assertNotNull(postMapping);
        assertEquals(ApiPaths.CURRENT_FOCUS_EVENTS, postMapping.value()[0]);
        assertEquals(
                "/api/race-players/me/focus-events",
                ApiPaths.RACE_PLAYERS_FOCUS_EVENTS
        );
    }

    private RacePlayerFocusEventRequest request() {
        RacePlayerFocusEventRequest request = new RacePlayerFocusEventRequest();
        request.setEventId(EVENT_ID);
        request.setType(RacePlayerFocusEventType.TAB_HIDDEN);
        return request;
    }
}
