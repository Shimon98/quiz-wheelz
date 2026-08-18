package com.quiz_wheelz.utils;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Pure date/time conversions and comparisons. This class never decides what
 * "now" is — the caller supplies every timestamp (services get theirs from
 * the shared application Clock, see TimeConfig). That keeps a single time
 * source and lets tests pin exact instants.
 */
public final class DateTimeUtils {

    private DateTimeUtils() {
    }

    public static long toEpochMilli(LocalDateTime dateTime, ZoneId zoneId) {
        if (dateTime == null) {
            throw new IllegalArgumentException("dateTime is required");
        }

        if (zoneId == null) {
            throw new IllegalArgumentException("zoneId is required");
        }

        return dateTime
                .atZone(zoneId)
                .toInstant()
                .toEpochMilli();
    }

    public static LocalDateTime toLocalDateTime(Instant instant, ZoneId zoneId) {
        if (instant == null) {
            throw new IllegalArgumentException("instant is required");
        }

        if (zoneId == null) {
            throw new IllegalArgumentException("zoneId is required");
        }

        return LocalDateTime.ofInstant(instant, zoneId);
    }

    /**
     * A deadline exactly equal to "now" counts as expired.
     */
    public static boolean isExpired(LocalDateTime expiresAt, LocalDateTime now) {
        if (expiresAt == null || now == null) {
            return false;
        }

        return !expiresAt.isAfter(now);
    }
}
