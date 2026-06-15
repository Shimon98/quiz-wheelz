package com.quiz_wheelz.sse;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;

public record SseConnection(
        String clientId,
        SseEmitter emitter,
        LocalDateTime connectedAt
) {
}