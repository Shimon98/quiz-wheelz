package com.quiz_wheelz.config;

import com.quiz_wheelz.common.AppConstants;
import com.quiz_wheelz.exception.ConfigurationException;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Getter
@Component
public class TokenConfig {

    private final Environment env;

    private int tokenExpirationMinutes;

    public TokenConfig(Environment env) {
        this.env = env;
    }

    @PostConstruct
    public void init() {
        this.tokenExpirationMinutes = env.getProperty(
                "TOKEN_EXPIRATION_MINUTES",
                Integer.class,
                AppConstants.DEFAULT_TOKEN_EXPIRATION_MINUTES
        );

        validate();
    }

    private void validate() {
        if (tokenExpirationMinutes <= 0) {
            throw new ConfigurationException(
                    "TOKEN_EXPIRATION_MINUTES must be positive. Current value: " + tokenExpirationMinutes
            );
        }
    }
}