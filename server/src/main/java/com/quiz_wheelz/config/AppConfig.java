package com.quiz_wheelz.config;

import com.quiz_wheelz.common.AppConstants;
import com.quiz_wheelz.exception.ConfigurationException;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Getter
@Component
public class AppConfig {

    private final Environment env;

    private String appName;
    private String clientUrl;

    public AppConfig(Environment env) {
        this.env = env;
    }

    @PostConstruct
    public void init() {
        this.appName = env.getProperty(
                "APP_NAME",
                String.class,
                AppConstants.DEFAULT_APP_NAME
        );

        this.clientUrl = env.getProperty(
                "APP_CLIENT_URL",
                String.class,
                AppConstants.DEFAULT_CLIENT_URL
        );

        validate();
    }

    private void validate() {
        if (appName == null || appName.isBlank()) {
            throw new ConfigurationException("APP_NAME must not be blank");
        }

        if (clientUrl == null || clientUrl.isBlank()) {
            throw new ConfigurationException("APP_CLIENT_URL must not be blank");
        }

        if (!clientUrl.startsWith("http://") && !clientUrl.startsWith("https://")) {
            throw new ConfigurationException(
                    "APP_CLIENT_URL must start with http:// or https://. Current value: " + clientUrl
            );
        }
    }
}