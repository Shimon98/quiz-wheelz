package com.quiz_wheelz.utils;

import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DateTimeUtilsTest {

    private static final ZoneId JERUSALEM = ZoneId.of("Asia/Jerusalem");

    @Test
    void toEpochMilliShouldConvertUsingTheGivenZone() {
        // 15:00 Israel summer time == 12:00 UTC.
        LocalDateTime local = LocalDateTime.of(2026, 8, 18, 15, 0, 0);

        long epochMs = DateTimeUtils.toEpochMilli(local, JERUSALEM);

        assertEquals(Instant.parse("2026-08-18T12:00:00Z").toEpochMilli(), epochMs);
    }

    @Test
    void toLocalDateTimeShouldReturnTheSameMomentInTheGivenZone() {
        LocalDateTime converted = DateTimeUtils.toLocalDateTime(
                Instant.parse("2026-08-18T12:00:00Z"),
                JERUSALEM
        );

        assertEquals(LocalDateTime.of(2026, 8, 18, 15, 0, 0), converted);
    }

    @Test
    void conversionsShouldRoundTripToTheSameInstant() {
        LocalDateTime local = LocalDateTime.of(2026, 1, 5, 8, 30, 15);

        long epochMs = DateTimeUtils.toEpochMilli(local, JERUSALEM);
        LocalDateTime roundTripped = DateTimeUtils.toLocalDateTime(
                Instant.ofEpochMilli(epochMs),
                JERUSALEM
        );

        assertEquals(local, roundTripped);
    }

    @Test
    void toEpochMilliShouldRejectMissingArguments() {
        assertThrows(
                IllegalArgumentException.class,
                () -> DateTimeUtils.toEpochMilli(null, JERUSALEM)
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> DateTimeUtils.toEpochMilli(LocalDateTime.now(), null)
        );
    }

    @Test
    void toLocalDateTimeShouldRejectMissingArguments() {
        assertThrows(
                IllegalArgumentException.class,
                () -> DateTimeUtils.toLocalDateTime(null, JERUSALEM)
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> DateTimeUtils.toLocalDateTime(Instant.EPOCH, null)
        );
    }

    @Test
    void isExpiredShouldTreatDeadlineEqualToNowAsExpired() {
        LocalDateTime now = LocalDateTime.of(2026, 8, 18, 15, 0, 0);

        assertTrue(DateTimeUtils.isExpired(now, now));
        assertTrue(DateTimeUtils.isExpired(now.minusSeconds(1), now));
        assertFalse(DateTimeUtils.isExpired(now.plusSeconds(1), now));
    }

    @Test
    void isExpiredShouldBeFalseForMissingArguments() {
        LocalDateTime now = LocalDateTime.of(2026, 8, 18, 15, 0, 0);

        assertFalse(DateTimeUtils.isExpired(null, now));
        assertFalse(DateTimeUtils.isExpired(now, null));
    }
}
