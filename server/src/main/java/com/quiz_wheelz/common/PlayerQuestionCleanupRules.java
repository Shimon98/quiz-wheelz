package com.quiz_wheelz.common;

public final class PlayerQuestionCleanupRules {

    public static final int RETENTION_DAYS = 7;

    public static final String DAILY_CLEANUP_CRON = "0 0 3 * * *";

    private PlayerQuestionCleanupRules() {
    }
}
