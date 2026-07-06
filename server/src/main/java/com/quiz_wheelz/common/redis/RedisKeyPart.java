package com.quiz_wheelz.common.redis;

import lombok.Getter;

@Getter
public enum RedisKeyPart {

    RACE("race"),
    PLAYER("player"),
    LAST_HEARTBEAT("last-heartbeat");

    private final String value;

    RedisKeyPart(String value) {
        this.value = value;
    }
}
