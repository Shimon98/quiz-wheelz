package com.quiz_wheelz.common;

public final class RaceProgressRules {

    public static final double WRONG_ANSWER_PROGRESS_DELTA = 0.0;

    public static final double EASY_CORRECT_PROGRESS_DELTA = 10.0;
    public static final double MEDIUM_CORRECT_PROGRESS_DELTA = 15.0;
    public static final double HARD_CORRECT_PROGRESS_DELTA = 20.0;

    /*
     * Continuous movement (C1-03M): track units per second at speed 1.0.
     * Initial balance targets a REGULAR (1000) race of ~3-4 min for an
     * engaged student and ~8:20 for a never-answering one (0.5 x 4 = 2
     * units/sec floor). Tuning knob — change here only.
     */
    public static final double BASE_MOVEMENT_UNITS_PER_SECOND = 4.0;

    /*
     * Bounded cumulative speed model (C1-03M): correct answers ADD a
     * difficulty boost up to the max; wrong/timeout subtract down to the
     * min. A RACING player never reaches zero speed — timeouts are worse
     * than wrong answers, but nothing stops the race except FINISHED.
     */
    public static final double MIN_RACING_SPEED = 0.5;
    public static final double MAX_RACING_SPEED = 2.0;

    public static final double EASY_CORRECT_SPEED_BOOST = 0.20;
    public static final double MEDIUM_CORRECT_SPEED_BOOST = 0.30;
    public static final double HARD_CORRECT_SPEED_BOOST = 0.40;

    public static final double WRONG_ANSWER_SPEED_PENALTY = 0.20;
    public static final double TIMEOUT_SPEED_PENALTY = 0.40;

    public static final double FINISHED_SPEED = 0.0;

    // Safety-settlement sweep cadence — a low-frequency scheduler, never a
    // frame loop; movement stays correct without it whenever requests arrive.
    public static final long MOVEMENT_SETTLEMENT_INTERVAL_MS = 5_000L;

    private RaceProgressRules() {
    }
}
