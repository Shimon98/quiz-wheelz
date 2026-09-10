package com.quiz_wheelz.exception;

import com.quiz_wheelz.common.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerUnreadableRequestTest {

    @Test
    void malformedEnumOrUuidRequestBodyReturnsBadRequest() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/race-players/me/focus-events");
        HttpMessageNotReadableException exception =
                new HttpMessageNotReadableException(
                        "Unreadable request",
                        mock(HttpInputMessage.class)
                );

        ResponseEntity<ErrorResponse> response = new GlobalExceptionHandler()
                .handleUnreadableRequest(exception, request);

        assertEquals(400, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(ErrorCode.BAD_REQUEST.getCode(), response.getBody().getCode());
    }
}
