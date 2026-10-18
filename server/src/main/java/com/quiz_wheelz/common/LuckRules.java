package com.quiz_wheelz.common;

public final class LuckRules {
    public static final int SHIELD_CORRECT_ANSWERS = 3;
    public static final int MAX_EVENTS = 2;
    public static final long COOLDOWN_MS = 45_000;
    public static final int ORB_ENERGY = 15;
    public static final int TAILWIND_MAGNITUDE_TENTHS = 2;
    public static final long TAILWIND_DURATION_MS = 4_000;
    public static final int MUD_MAGNITUDE_TENTHS = 1;
    public static final long MUD_DURATION_MS = 3_000;
    public static final long PROVISIONAL_ACTIVITY_WINDOW_MS = 60_000;
    public static final double EVENT_PROBABILITY = 0.60;

    private LuckRules() {
    }
}
