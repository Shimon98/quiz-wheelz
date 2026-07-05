package com.quiz_wheelz.common.redis;

import lombok.Getter;

@Getter
public enum RedisLockScope {

    RACE_TICK("race-tick"),
    RACE_RUNTIME_CHECKPOINT("race-runtime-checkpoint"),
    RACE_SSE_PUBLISH("race-sse-publish");

    private final String value;

    RedisLockScope(String value) {
        this.value = value;
    }
}
