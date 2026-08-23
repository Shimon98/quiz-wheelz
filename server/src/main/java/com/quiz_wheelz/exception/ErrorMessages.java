package com.quiz_wheelz.exception;

public final class ErrorMessages {

    public static final String RACE_NOT_JOINABLE = "Race is not open for joining";
    public static final String RACE_FULL = "Race is full";
    public static final String RACE_PLAYER_NAME_TAKEN =
            "Display name is already taken in this race";

    public static final String INVALID_PATH_PARAMETER = "Invalid path parameter";
    public static final String RACE_CANNOT_START_WITHOUT_PLAYERS = "Race cannot start without players";
    public static final String RACE_CANNOT_START_IN_CURRENT_STATUS = "Race cannot start in its current status";
    public static final String RACE_NOT_IN_PROGRESS =
            "Race is not currently in progress";

    public static final String RACE_TOTAL_DISTANCE_MISSING =
            "Race total distance is missing";

    public static final String RACE_PLAYER_RECONNECT_WINDOW_EXPIRED =
            "Race player reconnect window has expired";

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

    public static final String QUESTION_NOT_FOUND_FOR_PLAYER =
            "Question was not found for the current player";

    public static final String QUESTION_NOT_ACTIVE =
            "Question is not active";

    public static final String QUESTION_EXPIRED =
            "Question has expired";

    public static final String QUESTION_CHOICE_NOT_FOUND =
            "Question choice was not found for the submitted question";

    public static final String INVALID_ANSWER_SUBMISSION =
            "Invalid answer submission";

    public static final String REDIS_REQUIRED_BUT_DISABLED =
            "Redis cannot be required when Redis is disabled";

    public static final String REDIS_KEY_PREFIX_MISSING =
            "Redis key prefix must not be empty";

    public static final String REDIS_KEY_PREFIX_INVALID =
            "Redis key prefix contains invalid characters";

    public static final String REDIS_PASSWORD_REQUIRED =
            "Redis password must not be empty when Redis password is required";

    public static final String REDIS_REQUIRED_BUT_UNAVAILABLE =
            "Redis is required but did not respond to PING";

    public static final String REDIS_KEY_PART_MISSING =
            "Redis key part must not be empty";

    public static final String REDIS_KEY_PART_INVALID =
            "Redis key part contains invalid characters";

    public static final String REDIS_KEY_ID_MUST_BE_POSITIVE =
            "Redis key id must be positive";

    public static final String REDIS_KEY_IDENTIFIER_MISSING =
            "Redis key identifier must not be empty";

    public static final String REDIS_PRESENCE_IDS_MISSING =
            "Redis presence race id and race player id are required";

    public static final String REDIS_GAMEPLAY_ACTIVITY_TIMESTAMP_MISSING =
            "Redis gameplay activity timestamp is required";

    public static final String REDIS_HEARTBEAT_TIMESTAMP_MISSING =
            REDIS_GAMEPLAY_ACTIVITY_TIMESTAMP_MISSING;

    public static final String RACE_PLAYER_SESSION_IDENTITY_MISSING =
            "Race player session identity is missing";

    private ErrorMessages() {
    }
}
