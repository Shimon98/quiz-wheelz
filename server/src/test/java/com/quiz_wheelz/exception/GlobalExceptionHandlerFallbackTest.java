package com.quiz_wheelz.exception;

import com.quiz_wheelz.common.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GlobalExceptionHandlerFallbackTest {

    @Test
    void unexpectedExceptionStaysInternalError() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/teacher/dashboard");

        ResponseEntity<ErrorResponse> response = new GlobalExceptionHandler()
                .handleGeneralException(new IllegalStateException("unexpected"), request);

        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(ErrorCode.INTERNAL_ERROR.getCode(), response.getBody().getCode());
    }
}
