package com.quiz_wheelz.common;

import java.time.Duration;

public final class RacePlayerRuntimeRules {

    public static final Duration PRESENCE_TTL = Duration.ofSeconds(45);

    public static final String REDIS_PRESENCE_VALUE = "online";

    private RacePlayerRuntimeRules() {
    }
}
