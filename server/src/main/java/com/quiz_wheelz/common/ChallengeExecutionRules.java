package com.quiz_wheelz.common;

public final class ChallengeExecutionRules {
    public static final int TIME_LIMIT_SECONDS = 15;
    public static final int TURBO_QUESTIONS = 1;
    public static final int SAFE_QUESTIONS = 3;
    public static final int TURBO_PROGRESS = 80;
    public static final int TURBO_SCORE = 40;
    public static final int SAFE_PROGRESS = 15;
    public static final int SAFE_SCORE = 8;
    public static final int SAFE_PERFECT_PROGRESS = 10;
    public static final int SAFE_PERFECT_SCORE = 6;
    public static final int FAILURE_MAGNITUDE_TENTHS = 2;
    public static final long FAILURE_DURATION_MS = 4000;

    private ChallengeExecutionRules() {
    }
}
