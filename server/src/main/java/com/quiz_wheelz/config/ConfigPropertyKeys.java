package com.quiz_wheelz.config;

public final class ConfigPropertyKeys {

    public static final String TOKEN_SECRET = "TOKEN_SECRET";
    public static final String TOKEN_EXPIRATION_MINUTES = "TOKEN_EXPIRATION_MINUTES";

    public static final String AUTH_COOKIE_NAME = "AUTH_COOKIE_NAME";
    public static final String AUTH_COOKIE_MAX_AGE_SECONDS = "AUTH_COOKIE_MAX_AGE_SECONDS";
    public static final String AUTH_COOKIE_SECURE = "AUTH_COOKIE_SECURE";
    public static final String AUTH_COOKIE_SAME_SITE = "AUTH_COOKIE_SAME_SITE";
    public static final String RACE_PLAYER_COOKIE_NAME = "RACE_PLAYER_COOKIE_NAME";
    public static final String RACE_PLAYER_COOKIE_MAX_AGE_SECONDS = "RACE_PLAYER_COOKIE_MAX_AGE_SECONDS";

    public static final String CORS_ALLOWED_ORIGINS = "CORS_ALLOWED_ORIGINS";

    private ConfigPropertyKeys() {
    }
}
