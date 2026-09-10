package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TeacherRaceLiveCursorResolverTest {

    private final TeacherRaceLiveCursorResolver resolver =
            new TeacherRaceLiveCursorResolver();

    @Test
    void zeroCursorIsValid() {
        assertEquals(0L, resolver.resolve(null, "0", 7L));
    }

    @Test
    void lastEventIdTakesPrecedenceOverQueryCursor() {
        assertEquals(4L, resolver.resolve("4", "6", 7L));
    }

    @Test
    void validLastEventIdOverridesMalformedQueryCursor() {
        assertEquals(4L, resolver.resolve("4", "garbage", 7L));
    }

    @Test
    void missingCursorIsRejected() {
        assertInvalid(() -> resolver.resolve(null, null, 7L));
    }

    @Test
    void malformedLastEventIdIsRejectedWithoutQueryFallback() {
        assertInvalid(() -> resolver.resolve("invalid", "3", 7L));
    }

    @Test
    void malformedQueryCursorWithoutHeaderIsRejected() {
        assertInvalid(() -> resolver.resolve(null, "garbage", 7L));
    }

    @Test
    void blankSelectedCursorIsRejected() {
        assertInvalid(() -> resolver.resolve(null, " ", 7L));
    }

    @Test
    void negativeCursorIsRejected() {
        assertInvalid(() -> resolver.resolve(null, "-1", 7L));
    }

    @Test
    void cursorBeyondCurrentRaceVersionIsRejected() {
        assertInvalid(() -> resolver.resolve(null, "8", 7L));
    }

    private void assertInvalid(Runnable operation) {
        ApiException exception = assertThrows(ApiException.class, operation::run);
        assertEquals(ErrorCode.RACE_LIVE_EVENT_CURSOR_INVALID, exception.getErrorCode());
    }
}
