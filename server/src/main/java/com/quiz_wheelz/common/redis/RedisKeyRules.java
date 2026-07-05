package com.quiz_wheelz.common.redis;

public final class RedisKeyRules {

    public static final String DEFAULT_KEY_PREFIX = "quizwheelz:dev";

    public static final String DELIMITER = ":";

    public static final String KEY_PREFIX_PATTERN = "^[a-zA-Z0-9:_-]+$";
    public static final String KEY_PART_PATTERN = "^[a-zA-Z0-9._-]+$";

    public static final String PLAYER_IDENTIFIER_PREFIX = "player-";
    public static final String RACE_IDENTIFIER_PREFIX = "race-";
    public static final String IP_IDENTIFIER_PREFIX = "ip-";
    public static final String USERNAME_IDENTIFIER_PREFIX = "username-";

    private RedisKeyRules() {
    }
}
