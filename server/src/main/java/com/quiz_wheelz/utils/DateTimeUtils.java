package com.quiz_wheelz.utils;

import java.time.LocalDateTime;

public final class DateTimeUtils {

    private DateTimeUtils() {
    }

    public static boolean isExpired(LocalDateTime dateTime) {
        return dateTime != null && dateTime.isBefore(LocalDateTime.now());
    }

    public static boolean isNotExpired(LocalDateTime dateTime) {
        return !isExpired(dateTime);
    }
}