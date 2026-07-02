package com.quiz_wheelz.common;

public final class DifficultyProgressionRules {

    public static final int EASY_TO_MEDIUM_CORRECT_STREAK = 3;
    public static final int MEDIUM_TO_HARD_CORRECT_STREAK = 5;

    public static final int WRONG_STREAK_TO_LEVEL_DOWN = 2;

    public static final int RECOVERY_CORRECT_STREAK_AFTER_MEDIUM_TO_EASY = 1;
    public static final int RECOVERY_CORRECT_STREAK_AFTER_HARD_TO_MEDIUM = 3;

    private DifficultyProgressionRules() {
    }
}
