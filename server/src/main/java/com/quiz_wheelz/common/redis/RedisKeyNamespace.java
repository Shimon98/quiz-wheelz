package com.quiz_wheelz.common.redis;

import lombok.Getter;

@Getter
public enum RedisKeyNamespace {

    PRESENCE("presence"),
    RATE_LIMIT("rate-limit"),
    RACE_RUNTIME("race-runtime"),
    LEADERBOARD("leaderboard"),
    SSE("sse"),
    LOCK("lock");

    private final String value;

    RedisKeyNamespace(String value) {
        this.value = value;
    }
}
