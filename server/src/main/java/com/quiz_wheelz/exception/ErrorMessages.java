package com.quiz_wheelz.exception;

public final class ErrorMessages {

    public static final String RACE_NOT_JOINABLE = "Race is not open for joining";
    public static final String RACE_FULL = "Race is full";
    public static final String RACE_PLAYER_NAME_TAKEN =
            "Display name is already taken in this race";

    public static final String INVALID_PATH_PARAMETER = "Invalid path parameter";
    public static final String RACE_CANNOT_START_WITHOUT_PLAYERS = "Race cannot start without players";
    public static final String RACE_CANNOT_START_IN_CURRENT_STATUS = "Race cannot start in its current status";

    private ErrorMessages() {
    }
}
