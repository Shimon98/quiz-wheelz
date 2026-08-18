package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerHeartbeatResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerLeaveResponse;
import com.quiz_wheelz.dto.raceplayer.RacePlayerReconnectResponse;
import com.quiz_wheelz.enums.RacePlayerReconnectOutcome;
import com.quiz_wheelz.enums.RacePlayerStatus;
import com.quiz_wheelz.enums.RaceStatus;
import com.quiz_wheelz.service.raceplayer.CurrentRacePlayerService;
import com.quiz_wheelz.service.raceplayer.RacePlayerJoinService;
import com.quiz_wheelz.service.raceplayer.RacePlayerRuntimeSessionService;
import com.quiz_wheelz.service.raceplayer.StudentRaceStateService;
import com.quiz_wheelz.service.question.StudentAnswerSubmissionService;
import com.quiz_wheelz.service.question.StudentQuestionDeliveryService;
import com.quiz_wheelz.utils.CookieUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerControllerRuntimeSessionTest {

    @Mock
    private RacePlayerJoinService racePlayerJoinService;

    @Mock
    private CookieUtils cookieUtils;

    @Mock
    private CurrentRacePlayerService currentRacePlayerService;

    @Mock
    private StudentQuestionDeliveryService studentQuestionDeliveryService;

    @Mock
    private StudentAnswerSubmissionService studentAnswerSubmissionService;

    @Mock
    private StudentRaceStateService studentRaceStateService;

    @Mock
    private RacePlayerRuntimeSessionService racePlayerRuntimeSessionService;

    @Mock
    private HttpServletRequest request;

    @Test
    void heartbeatShouldReturnApiResponseAndDelegateToRuntimeSessionService() {
        RacePlayerHeartbeatResponse heartbeatResponse =
                new RacePlayerHeartbeatResponse(
                        1L,
                        12L,
                        LocalDateTime.of(2026, 7, 6, 13, 20)
                );
        when(racePlayerRuntimeSessionService.heartbeat(request))
                .thenReturn(heartbeatResponse);

        ResponseEntity<ApiResponse<RacePlayerHeartbeatResponse>> response =
                createController().heartbeat(request);

        ApiResponse<RacePlayerHeartbeatResponse> body = response.getBody();

        assertEquals(200, response.getStatusCode().value());
        assertTrue(body.isSuccess());
        assertEquals(
                ApiMessages.RACE_PLAYER_HEARTBEAT_RECEIVED_SUCCESSFULLY,
                body.getMessage()
        );
        assertSame(heartbeatResponse, body.getData());

        verify(racePlayerRuntimeSessionService).heartbeat(request);
    }

    @Test
    void leaveShouldReturnApiResponseAndDelegateToRuntimeSessionService() {
        RacePlayerLeaveResponse leaveResponse =
                new RacePlayerLeaveResponse(
                        12L,
                        LocalDateTime.of(2026, 7, 6, 13, 25),
                        RacePlayerStatus.DISCONNECTED
                );
        when(racePlayerRuntimeSessionService.leave(request))
                .thenReturn(leaveResponse);

        ResponseEntity<ApiResponse<RacePlayerLeaveResponse>> response =
                createController().leave(request);

        ApiResponse<RacePlayerLeaveResponse> body = response.getBody();

        assertEquals(200, response.getStatusCode().value());
        assertTrue(body.isSuccess());
        assertEquals(
                ApiMessages.RACE_PLAYER_LEFT_SUCCESSFULLY,
                body.getMessage()
        );
        assertSame(leaveResponse, body.getData());

        verify(racePlayerRuntimeSessionService).leave(request);
    }

    @Test
    void reconnectShouldReturnApiResponseAndDelegateToRuntimeSessionService() {
        RacePlayerReconnectResponse reconnectResponse =
                new RacePlayerReconnectResponse(
                        1L,
                        12L,
                        RacePlayerReconnectOutcome.RECONNECTED,
                        true,
                        true,
                        RacePlayerStatus.RACING,
                        RaceStatus.IN_PROGRESS,
                        LocalDateTime.of(2026, 7, 6, 13, 27)
                );
        when(racePlayerRuntimeSessionService.reconnect(request))
                .thenReturn(reconnectResponse);

        ResponseEntity<ApiResponse<RacePlayerReconnectResponse>> response =
                createController().reconnect(request);

        ApiResponse<RacePlayerReconnectResponse> body = response.getBody();

        assertEquals(200, response.getStatusCode().value());
        assertTrue(body.isSuccess());
        assertEquals(
                ApiMessages.RACE_PLAYER_RECONNECT_RESOLVED_SUCCESSFULLY,
                body.getMessage()
        );
        assertSame(reconnectResponse, body.getData());

        verify(racePlayerRuntimeSessionService).reconnect(request);
    }

    private RacePlayerController createController() {
        return new RacePlayerController(
                racePlayerJoinService,
                cookieUtils,
                currentRacePlayerService,
                studentQuestionDeliveryService,
                studentAnswerSubmissionService,
                studentRaceStateService,
                racePlayerRuntimeSessionService
        );
    }
}
