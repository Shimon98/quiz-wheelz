package com.quiz_wheelz.service.livestream;


import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class RaceLiveStreamCursorResolver {

    public long resolve(
            String lastEventId,
            String afterVersion,
            long currentVersion
    ) {
        String selectedCursor = lastEventId != null ? lastEventId : afterVersion;
        long cursor = parseSelectedCursor(selectedCursor);

        if (cursor < 0 || cursor > currentVersion) {
            throw invalidCursor();
        }
        return cursor;
    }

    private long parseSelectedCursor(String selectedCursor) {
        if (selectedCursor == null || selectedCursor.isBlank()) {
            throw invalidCursor();
        }
        try {
            return Long.parseLong(selectedCursor);
        } catch (NumberFormatException exception) {
            throw invalidCursor();
        }
    }

    private ApiException invalidCursor() {
        return new ApiException(ErrorCode.RACE_LIVE_EVENT_CURSOR_INVALID);
    }
}
