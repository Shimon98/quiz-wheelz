package com.quiz_wheelz.common;

public final class AdaptiveRules {

    public static final int MIN_QUESTIONS_BEFORE_ADAPTIVE_CHANGE = 5;

    public static final double MIN_SUCCESS_RATE_FOR_LEVEL_UP = 0.80;
    public static final double MAX_SUCCESS_RATE_FOR_LEVEL_DOWN = 0.45;

    public static final int RECENT_ANSWERS_WINDOW_SIZE = 5;

    private AdaptiveRules() {
    }
}
