package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceFinishArbitrationResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceFinishOrderResponse;
import com.quiz_wheelz.dto.raceplayer.StudentRaceSnapshotContractFixture;
import com.quiz_wheelz.service.raceplayer.StudentRaceFinishArbitrationService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;

import java.lang.reflect.Method;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RacePlayerControllerFinishArbitrationTest {

    @Mock
    private StudentRaceFinishArbitrationService arbitrationService;

    @Mock
    private HttpServletRequest request;

    @Test
    void arbitrationDelegatesToTheFocusedServiceAndWrapsTheResponse() {
        StudentRaceFinishArbitrationResponse serviceResponse =
                new StudentRaceFinishArbitrationResponse(
                        12L,
                        StudentRaceSnapshotContractFixture.snapshot(),
                        new StudentRaceFinishOrderResponse(1L, 153L, null, List.of())
                );
        when(arbitrationService.arbitrate(request)).thenReturn(serviceResponse);

        ResponseEntity<ApiResponse<StudentRaceFinishArbitrationResponse>> response =
                controller().arbitrateFinish(request);

        ApiResponse<StudentRaceFinishArbitrationResponse> body = response.getBody();
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(body);
        assertTrue(body.isSuccess());
        assertEquals(
                ApiMessages.STUDENT_RACE_FINISH_ARBITRATION_RESOLVED_SUCCESSFULLY,
                body.getMessage()
        );
        assertSame(serviceResponse, body.getData());
        verify(arbitrationService).arbitrate(request);
    }

    @Test
    void arbitrationIsABodilessPostOnTheCurrentPlayerPath() throws NoSuchMethodException {
        Method endpoint = RacePlayerController.class.getMethod(
                "arbitrateFinish",
                HttpServletRequest.class
        );
        PostMapping postMapping = endpoint.getAnnotation(PostMapping.class);

        assertNotNull(postMapping);
        assertEquals(ApiPaths.CURRENT_FINISH_ARBITRATION, postMapping.value()[0]);
        assertEquals(1, endpoint.getParameterCount());
        assertEquals(
                "/api/race-players/me/finish-arbitration",
                ApiPaths.RACE_PLAYERS_FINISH_ARBITRATION
        );
    }

    private RacePlayerController controller() {
        return new RacePlayerController(
                mock(com.quiz_wheelz.service.raceplayer.RacePlayerJoinService.class),
                mock(com.quiz_wheelz.utils.CookieUtils.class),
                mock(com.quiz_wheelz.service.raceplayer.CurrentRacePlayerService.class),
                mock(com.quiz_wheelz.service.question.StudentQuestionDeliveryService.class),
                mock(com.quiz_wheelz.service.question.StudentAnswerSubmissionService.class),
                mock(com.quiz_wheelz.service.raceplayer.StudentRaceStateService.class),
                mock(com.quiz_wheelz.service.raceplayer.RacePlayerRuntimeSessionService.class),
                arbitrationService
        );
    }
}
