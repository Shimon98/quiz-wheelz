package com.quiz_wheelz.common;

import java.math.BigDecimal;

public final class RecoveryRules {
    public static final int OUTCOME_WINDOW = 6;
    public static final int MIN_FAILURES = 3;
    public static final BigDecimal MIN_LEADER_GAP_RATIO = new BigDecimal("0.12");
    public static final BigDecimal MIN_MEDIAN_GAP_RATIO = new BigDecimal("0.06");
    public static final BigDecimal MAX_PROGRESS_RATIO = new BigDecimal("0.65");
    public static final int MIN_RACING_PLAYERS = 2;
    public static final int NUDGE_ENERGY = 10;

    private RecoveryRules() {
    }
}
