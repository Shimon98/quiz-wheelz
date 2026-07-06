package com.quiz_wheelz.common;

import java.time.Duration;

public final class RacePlayerRuntimeRules {

    public static final Duration PRESENCE_TTL = Duration.ofSeconds(45);

    public static final String REDIS_PRESENCE_VALUE = "online";

    public static final String REDIS_PRESENCE_NAMESPACE = "presence";
    public static final String REDIS_RACE_KEY_PART = "race";
    public static final String REDIS_PLAYER_KEY_PART = "player";

    private RacePlayerRuntimeRules() {
    }
}
