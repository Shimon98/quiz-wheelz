package com.quiz_wheelz.common;

import java.time.Duration;

public final class RacePlayerRuntimeRules {

    public static final Duration PRESENCE_TTL = Duration.ofSeconds(45);

    public static final Duration RECONNECT_GRACE_PERIOD = Duration.ofMinutes(5);

    public static final Duration LAST_GAMEPLAY_ACTIVITY_TTL = Duration.ofHours(2);

    public static final Duration LAST_HEARTBEAT_TTL = LAST_GAMEPLAY_ACTIVITY_TTL;

    public static final Duration LAST_SEEN_DB_CHECKPOINT_INTERVAL = Duration.ofSeconds(30);

    public static final String REDIS_PRESENCE_VALUE = "online";

    private RacePlayerRuntimeRules() {
    }
}
