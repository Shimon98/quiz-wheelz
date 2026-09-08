package com.quiz_wheelz.service.teacher;

import com.quiz_wheelz.config.SseConfig;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Objects;

@Component
public class TeacherRaceLiveEmitterFactory {

    private final SseConfig sseConfig;

    public TeacherRaceLiveEmitterFactory(SseConfig sseConfig) {
        this.sseConfig = Objects.requireNonNull(sseConfig);
    }

    public SseEmitter create() {
        return new SseEmitter(sseConfig.getSseTimeoutMillis());
    }
}
