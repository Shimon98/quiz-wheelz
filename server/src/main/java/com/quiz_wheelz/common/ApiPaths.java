package com.quiz_wheelz.common;

public final class ApiPaths {

    public static final String AUTH_BASE = AppConstants.API_PREFIX + "/auth";
    public static final String LOGIN = "/login";
    public static final String ME = "/me";
    public static final String LOGOUT = "/logout";

    public static final String AUTH_LOGIN = AUTH_BASE + LOGIN;
    public static final String AUTH_ME = AUTH_BASE + ME;
    public static final String AUTH_LOGOUT = AUTH_BASE + LOGOUT;

    public static final String SUBJECTS = AppConstants.API_PREFIX + "/subjects";

    public static final String TEACHER_BASE = AppConstants.API_PREFIX + "/teacher";
    public static final String TEACHER_RACES = TEACHER_BASE + "/races";
    public static final String TEACHER_DASHBOARD = TEACHER_BASE + "/dashboard";

    public static final String RACE_ID = "/{raceId}";
    public static final String ROOM = "/room";
    public static final String TEACHER_RACE_ROOM = RACE_ID + ROOM;

    public static final String ACTUATOR_HEALTH = "/actuator/health";
    public static final String SWAGGER_UI = "/swagger-ui/**";
    public static final String API_DOCS = "/v3/api-docs/**";
    public static final String ALL_API_ENDPOINTS = AppConstants.API_PREFIX + "/**";

    private ApiPaths() {
    }
}