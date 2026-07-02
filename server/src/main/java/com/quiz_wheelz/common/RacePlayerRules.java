package com.quiz_wheelz.common;

import java.util.List;

public final class RacePlayerRules {

    public static final int MIN_DISPLAY_NAME_LENGTH = 2;
    public static final int MAX_DISPLAY_NAME_LENGTH = 30;

    public static final int MIN_LANE_NUMBER = 1;

    public static final int MAX_VEHICLE_KEY_LENGTH = 40;

    public static final double DEFAULT_POSITION = 0.0;
    public static final double DEFAULT_SPEED = 0.0;

    public static final int DEFAULT_SCORE = 0;
    public static final int DEFAULT_STREAK = 0;
    public static final int DEFAULT_HIGHEST_STREAK = 0;
    public static final int DEFAULT_CORRECT_ANSWERS = 0;
    public static final int DEFAULT_WRONG_ANSWERS = 0;
    public static final int DEFAULT_DIFFICULTY_CORRECT_STREAK = 0;
    public static final int DEFAULT_DIFFICULTY_WRONG_STREAK = 0;

    public static final String DEFAULT_VEHICLE_TYPE_KEY = "TOY_CAR";
    public static final String DEFAULT_VEHICLE_COLOR_KEY = "PURPLE";

    public static final List<String> VEHICLE_COLOR_KEYS = List.of(
            "PURPLE",
            "RED",
            "BLUE",
            "GREEN",
            "ORANGE",
            "PINK",
            "YELLOW",
            "CYAN"
    );

    public static final String VEHICLE_ASSET_SEPARATOR = "_";

    private RacePlayerRules() {
    }
}
