package com.quiz_wheelz.common;

public final class AppConstants {

    public static final String API_PREFIX = "/api";
    public static final String BEARER_PREFIX = "Bearer ";

    public static final String DEFAULT_APP_NAME = "Quiz Wheelz";
    public static final String DEFAULT_CLIENT_URL = "http://localhost:5173";

    public static final String DEFAULT_CORS_ALLOWED_ORIGINS =
            "http://localhost:5173,http://localhost:3000";

    public static final int DEFAULT_TOKEN_EXPIRATION_MINUTES = 120;

    public static final long DEFAULT_SSE_TIMEOUT_MILLIS = 1_800_000L;

    private AppConstants() {
    }
}