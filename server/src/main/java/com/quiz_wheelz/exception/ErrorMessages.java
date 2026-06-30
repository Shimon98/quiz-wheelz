package com.quiz_wheelz.exception;

public final class ErrorMessages {

    public static final String RACE_NOT_JOINABLE = "Race is not open for joining";
    public static final String RACE_FULL = "Race is full";
    public static final String RACE_PLAYER_NAME_TAKEN =
            "Display name is already taken in this race";

    public static final String INVALID_PATH_PARAMETER = "Invalid path parameter";
    public static final String RACE_CANNOT_START_WITHOUT_PLAYERS = "Race cannot start without players";
    public static final String RACE_CANNOT_START_IN_CURRENT_STATUS = "Race cannot start in its current status";

    public static final String QUESTION_TEMPLATE_NOT_FOUND =
            "Active question template not found";

    public static final String QUESTION_TYPE_NOT_SUPPORTED =
            "Question type is not supported by the question generator";

    public static final String QUESTION_GENERATION_FAILED =
            "Question generation failed";

    public static final String INVALID_QUESTION_TEMPLATE_CONFIG =
            "Invalid question template configuration";

    public static final String RACE_PLAYER_TOKEN_MISSING =
            "Race player token is missing";

    public static final String INVALID_RACE_PLAYER_TOKEN =
            "Invalid race player token";

    public static final String RACE_PLAYER_NOT_FOUND =
            "Race player not found";

    public static final String RACE_PLAYER_NOT_RACING =
            "Race player is not currently racing";

    public static final String QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER =
            "No active question template is available for the current player state";

    private ErrorMessages() {
    }
}
