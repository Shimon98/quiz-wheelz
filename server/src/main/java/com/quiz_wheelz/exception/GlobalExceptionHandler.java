package com.quiz_wheelz.exception;

import com.quiz_wheelz.common.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.util.DisconnectedClientHelper;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Winsock 10053 and 10054: the Windows words for Spring's "broken pipe" and "connection reset by peer".
    private static final List<String> WINDOWS_DISCONNECT_PHRASES =
            List.of("an established connection was aborted", "an existing connection was forcibly closed");

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
        ErrorCode errorCode = ex.getErrorCode();
        ErrorResponse response = ErrorResponse.from(errorCode, ex.getMessage(), request.getRequestURI());
        return ResponseEntity.status(errorCode.getStatus())
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> validationErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                validationErrors.put(error.getField(), error.getDefaultMessage())
        );
        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;
        ErrorResponse response = ErrorResponse.validation(errorCode, request.getRequestURI(), validationErrors);
        return ResponseEntity.status(errorCode.getStatus())
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableRequest(
            HttpMessageNotReadableException ex,
            HttpServletRequest request
    ) {
        ErrorCode errorCode = ErrorCode.BAD_REQUEST;
        ErrorResponse response = ErrorResponse.from(errorCode, request.getRequestURI());
        return ResponseEntity.status(errorCode.getStatus())
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }


    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request
    ) {
        ErrorCode errorCode = ErrorCode.BAD_REQUEST;
        ErrorResponse response = ErrorResponse.from(
                errorCode,
                ErrorMessages.INVALID_PATH_PARAMETER,
                request.getRequestURI()
        );

        return ResponseEntity.status(errorCode.getStatus())
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }

    // A @PreAuthorize denial is thrown inside the controller call, so without this handler the
    // Exception catch-all below would turn it into 500 INTERNAL_ERROR. Rethrowing hands it back to
    // Spring Security's ExceptionTranslationFilter, which answers 401 for anonymous callers and 403
    // for authenticated ones through RestAuthenticationEntryPoint / RestAccessDeniedHandler.
    @ExceptionHandler(AccessDeniedException.class)
    public void rethrowAccessDenied(AccessDeniedException ex) {
        throw ex;
    }

    // The client only ever gets the generic body, so the cause and its stack trace must stay findable in the server
    // log. Method and path only: no query string, headers, cookies or body.
    // Two kinds of failure are not server failures, and this catch-all used to answer 500 for both:
    // - Spring's own request errors (a wrong method, an unknown path, a missing parameter) carry their HTTP status;
    //   rethrowing hands them back to Spring MVC, which answers 405/404/400, like AccessDeniedException above.
    // - A client that went away (a closed tab ends its SSE stream) has nothing left to answer. Spring's helper knows
    //   the usual signs, and Windows says the same in words it does not know (WINDOWS_DISCONNECT_PHRASES).
    // An IOException nobody recognizes on a response that already started is not proof of a disconnect: it may be a
    // real stream fault. No error body can follow a started response, so it leaves one WARN line instead.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(
            Exception ex, HttpServletRequest request, HttpServletResponse servletResponse) throws Exception {
        if (ex instanceof org.springframework.web.ErrorResponse) {
            throw ex;
        }
        if (isClientDisconnect(ex)) {
            LOGGER.debug("Client went away on {} {}: {}", request.getMethod(), request.getRequestURI(), ex.toString());
            return null;
        }
        if (ex instanceof IOException && servletResponse.isCommitted()) {
            LOGGER.warn("I/O failure after the response started on {} {}: {}",
                    request.getMethod(), request.getRequestURI(), ex.toString());
            return null;
        }
        LOGGER.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
        ErrorCode errorCode = ErrorCode.INTERNAL_ERROR;
        ErrorResponse response = ErrorResponse.from(errorCode, request.getRequestURI());
        return ResponseEntity.status(errorCode.getStatus())
                .contentType(MediaType.APPLICATION_JSON)
                .body(response);
    }

    // Only an IOException can carry these words for a client, so a failing onward connection (a DataAccessException
    // from Redis or the database) is never mistaken for one, as in Spring's own helper.
    private static boolean isClientDisconnect(Exception ex) {
        if (DisconnectedClientHelper.isClientDisconnectedException(ex)) {
            return true;
        }
        String message = NestedExceptionUtils.getMostSpecificCause(ex).getMessage();
        return ex instanceof IOException && message != null
                && WINDOWS_DISCONNECT_PHRASES.stream().anyMatch(message.toLowerCase(Locale.ROOT)::contains);
    }
}
