package com.quiz_wheelz.common;

import java.math.BigDecimal;

public final class ChallengeRules {
    public static final int ENERGY_THRESHOLD = 100;
    public static final int EASY_GAIN = 20;
    public static final int MEDIUM_GAIN = 25;
    public static final int HARD_GAIN = 30;
    public static final long OFFER_DURATION_MS = 12_000;
    public static final BigDecimal FINISH_GATE_RATIO = new BigDecimal("0.80");
    public static final int EXPIRY_RESTORE_ENERGY = 50;
    public static final int HESITATION_MAGNITUDE_TENTHS = 1;
    public static final long HESITATION_DURATION_MS = 4_000;

    private ChallengeRules() {
    }
}
