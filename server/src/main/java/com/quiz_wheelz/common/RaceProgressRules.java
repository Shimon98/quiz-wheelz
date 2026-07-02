package com.quiz_wheelz.common;

public final class RaceProgressRules {

    public static final double WRONG_ANSWER_PROGRESS_DELTA = 0.0;

    public static final double EASY_CORRECT_PROGRESS_DELTA = 10.0;
    public static final double MEDIUM_CORRECT_PROGRESS_DELTA = 15.0;
    public static final double HARD_CORRECT_PROGRESS_DELTA = 20.0;

    public static final double EASY_CORRECT_SPEED = 1.0;
    public static final double MEDIUM_CORRECT_SPEED = 1.5;
    public static final double HARD_CORRECT_SPEED = 2.0;

    public static final double WRONG_ANSWER_SPEED_PENALTY = 0.5;
    public static final double MIN_RACING_SPEED = 0.5;
    public static final double FINISHED_SPEED = 0.0;

    private RaceProgressRules() {
    }
}
