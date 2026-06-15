package com.quiz_wheelz.config;

import com.quiz_wheelz.common.AppConstants;
import com.quiz_wheelz.exception.ConfigurationException;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Getter
@Component
public class SseConfig {

    private final Environment env;
    private long sseTimeoutMillis;

    public SseConfig(Environment env) {
        this.env = env;
    }

    @PostConstruct
    public void init() {
        this.sseTimeoutMillis = env.getProperty(
                "SSE_TIMEOUT_MILLIS",
                Long.class,
                AppConstants.DEFAULT_SSE_TIMEOUT_MILLIS
        );

        validate();
    }

    private void validate() {
        if (sseTimeoutMillis <= 0) {
            throw new ConfigurationException(
                    "SSE_TIMEOUT_MILLIS must be positive. Current value: " + sseTimeoutMillis
            );
        }
    }
}