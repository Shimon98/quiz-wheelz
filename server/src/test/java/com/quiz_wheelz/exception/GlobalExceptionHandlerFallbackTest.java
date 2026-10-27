package com.quiz_wheelz.exception;

import com.quiz_wheelz.common.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.io.IOException;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
class GlobalExceptionHandlerFallbackTest {

    @Test
    void unexpectedExceptionStaysInternalError() throws Exception {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/teacher/dashboard");

        ResponseEntity<ErrorResponse> response = new GlobalExceptionHandler()
                .handleGeneralException(new IllegalStateException("unexpected"), request, response(false));

        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(ErrorCode.INTERNAL_ERROR.getCode(), response.getBody().getCode());
    }

    @Test
    void unexpectedExceptionIsLoggedWithItsStackTraceButNeverSentToTheClient(CapturedOutput output) throws Exception {
        HttpServletRequest request = request("POST", "/api/race-players/me/answers");

        ResponseEntity<ErrorResponse> response = new GlobalExceptionHandler()
                .handleGeneralException(new IllegalStateException("lock wait timeout on race_players"), request,
                        response(false));

        assertEquals(ErrorCode.INTERNAL_ERROR.getDefaultMessage(), response.getBody().getMessage());
        String log = output.getAll();
        assertTrue(log.contains("Unhandled exception on POST /api/race-players/me/answers"), log);
        assertTrue(log.contains("java.lang.IllegalStateException: lock wait timeout on race_players"), log);
        assertTrue(log.contains("at com.quiz_wheelz.exception.GlobalExceptionHandlerFallbackTest"), log);
    }

    static Stream<Exception> springRequestErrors() {
        return Stream.of(
                new HttpRequestMethodNotSupportedException("GET"),
                new NoResourceFoundException(HttpMethod.GET, "/api/teacher/unknown"),
                new MissingServletRequestParameterException("raceId", "Long")
        );
    }

    @ParameterizedTest
    @MethodSource("springRequestErrors")
    void springRequestErrorsGoBackToSpringUnlogged(Exception failure, CapturedOutput output) {
        HttpServletRequest request = request("GET", "/api/teacher/races");

        Exception thrown = assertThrows(Exception.class,
                () -> new GlobalExceptionHandler().handleGeneralException(failure, request, response(false)));

        assertSame(failure, thrown);
        assertFalse(output.getAll().contains("Unhandled exception"), output.getAll());
    }

    static Stream<Exception> clientsThatWentAway() {
        return Stream.of(
                new AsyncRequestNotUsableException("the student closed the stream"),
                new IOException("Broken pipe"),
                // The Windows wordings (Winsock 10053 and 10054), which Spring's phrase list does not know.
                new IOException("An established connection was aborted by the software in your host machine"),
                new IOException("An existing connection was forcibly closed by the remote host")
        );
    }

    @ParameterizedTest
    @MethodSource("clientsThatWentAway")
    void clientThatWentAwayIsNeitherAnsweredNorLoggedAsAFailure(Exception failure, CapturedOutput output)
            throws Exception {
        HttpServletRequest request = request("GET", "/api/race-players/me/events/stream");

        ResponseEntity<ErrorResponse> response = new GlobalExceptionHandler()
                .handleGeneralException(failure, request, response(true));

        assertNull(response);
        assertFalse(output.getAll().contains("Unhandled exception"), output.getAll());
        assertFalse(output.getAll().contains("after the response started"), output.getAll());
    }

    @Test
    void windowsDisconnectIsKnownByItsWordsEvenBeforeTheResponseStarted(CapturedOutput output) throws Exception {
        HttpServletRequest request = request("GET", "/api/race-players/me/events/stream");

        ResponseEntity<ErrorResponse> response = new GlobalExceptionHandler().handleGeneralException(
                new IOException("An established connection was aborted by the software in your host machine"),
                request, response(false));

        assertNull(response);
        assertFalse(output.getAll().contains("Unhandled exception"), output.getAll());
    }

    // A response that already started cannot carry an error body, but an I/O failure nobody recognizes as a
    // disconnect may be a real stream fault, so it leaves one WARN line instead of disappearing.
    @Test
    void unknownIoFailureAfterTheResponseStartedIsReportedOnceButNotAnswered(CapturedOutput output) throws Exception {
        HttpServletRequest request = request("GET", "/api/race-players/me/events/stream");

        ResponseEntity<ErrorResponse> response = new GlobalExceptionHandler().handleGeneralException(
                new IOException("Stream encoder lost its buffer"), request, response(true));

        assertNull(response);
        String log = output.getAll();
        String line = log.lines()
                .filter(entry -> entry.contains("I/O failure after the response started on GET /api/race-players/me/events/stream"))
                .findFirst()
                .orElseThrow(() -> new AssertionError(log));
        assertTrue(line.contains("WARN"), line);
        assertTrue(line.contains("java.io.IOException: Stream encoder lost its buffer"), line);
        assertFalse(log.contains("Unhandled exception"), log);
    }

    @Test
    void ioFailureBeforeAnyResponseIsStillAServerFailure(CapturedOutput output) throws Exception {
        HttpServletRequest request = request("GET", "/api/teacher/dashboard");

        ResponseEntity<ErrorResponse> response = new GlobalExceptionHandler()
                .handleGeneralException(new IOException("No space left on device"), request, response(false));

        assertEquals(500, response.getStatusCode().value());
        assertTrue(output.getAll().contains("Unhandled exception on GET /api/teacher/dashboard"), output.getAll());
    }

    @Test
    void knownApiErrorIsNotLoggedAsAServerFailure(CapturedOutput output) {
        HttpServletRequest request = request("POST", "/api/race-players/me/answers");

        ResponseEntity<ErrorResponse> response = new GlobalExceptionHandler()
                .handleApiException(new ApiException(ErrorCode.QUESTION_EXPIRED), request);

        assertEquals(ErrorCode.QUESTION_EXPIRED.getStatus().value(), response.getStatusCode().value());
        assertFalse(output.getAll().contains("Unhandled exception"), output.getAll());
    }

    private static HttpServletRequest request(String method, String path) {
        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getMethod()).thenReturn(method);
        when(request.getRequestURI()).thenReturn(path);
        return request;
    }

    private static HttpServletResponse response(boolean committed) {
        HttpServletResponse response = mock(HttpServletResponse.class);
        when(response.isCommitted()).thenReturn(committed);
        return response;
    }
}
