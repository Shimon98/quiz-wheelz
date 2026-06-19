package com.quiz_wheelz.security;

public final class SecurityExpressions {

    public static final String HAS_ROLE_TEACHER = "hasRole('TEACHER')";
    public static final String HAS_ROLE_ADMIN = "hasRole('ADMIN')";
    public static final String HAS_ROLE_STUDENT = "hasRole('STUDENT')";
    public static final String HAS_ANY_ROLE_TEACHER_ADMIN =
            "hasAnyRole('TEACHER', 'ADMIN')";

    private SecurityExpressions() {
    }
}