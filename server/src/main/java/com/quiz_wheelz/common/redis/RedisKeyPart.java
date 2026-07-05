package com.quiz_wheelz.common.redis;

import lombok.Getter;

@Getter
public enum RedisKeyPart {

    RACE("race"),
    PLAYER("player");

    private final String value;

    RedisKeyPart(String value) {
        this.value = value;
    }
}
