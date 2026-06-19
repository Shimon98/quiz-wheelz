package com.quiz_wheelz.config;

import com.quiz_wheelz.common.AppConstants;
import com.quiz_wheelz.exception.ConfigurationException;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    private final Environment env;

    private String[] allowedOrigins;

    public CorsConfig(Environment env) {
        this.env = env;
    }

    @PostConstruct
    public void init() {
        String origins = env.getProperty(
                ConfigPropertyKeys.CORS_ALLOWED_ORIGINS,
                String.class,
                AppConstants.DEFAULT_CORS_ALLOWED_ORIGINS
        );

        if (origins == null || origins.isBlank()) {
            throw new ConfigurationException("CORS_ALLOWED_ORIGINS must not be blank");
        }

        this.allowedOrigins = Arrays.stream(origins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toArray(String[]::new);

        validate();
    }

    private void validate() {
        if (allowedOrigins.length == 0) {
            throw new ConfigurationException("CORS_ALLOWED_ORIGINS must contain at least one origin");
        }

        for (String origin : allowedOrigins) {
            if (!origin.startsWith("http://") && !origin.startsWith("https://")) {
                throw new ConfigurationException(
                        "Each CORS origin must start with http:// or https://. Invalid value: " + origin
                );
            }
        }
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        String[] origins = this.allowedOrigins;

        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping(AppConstants.API_PREFIX + "/**")
                        .allowedOrigins(origins)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}