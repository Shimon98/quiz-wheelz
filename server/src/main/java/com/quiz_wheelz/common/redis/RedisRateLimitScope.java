package com.quiz_wheelz.common.redis;

import lombok.Getter;

@Getter
public enum RedisRateLimitScope {

    LOGIN("login"),
    JOIN_RACE("join-race"),
    HEARTBEAT("heartbeat"),
    RECONNECT("reconnect"),
    SUBMIT_ANSWER("submit-answer");

    private final String value;

    RedisRateLimitScope(String value) {
        this.value = value;
    }
}
