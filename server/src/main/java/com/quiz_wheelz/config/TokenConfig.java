package com.quiz_wheelz.config;

import com.quiz_wheelz.exception.ConfigurationException;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Getter
@Component
public class TokenConfig {

    private static final int DEFAULT_TOKEN_EXPIRATION_MINUTES = 120;
    private static final String DEFAULT_COOKIE_NAME = "AUTH_TOKEN";
    private static final String DEFAULT_RACE_PLAYER_COOKIE_NAME = "RACE_PLAYER_TOKEN";
    private static final String DEFAULT_COOKIE_SAME_SITE = "Lax";
    private static final String MUST_NOT_BE_EMPTY = " must not be empty";
    private static final String MUST_BE_POSITIVE_CURRENT_VALUE = " must be positive. Current value: ";
    private static final boolean DEFAULT_COOKIE_SECURE = false;

    private static final int SECONDS_IN_MINUTE = 60;
    private static final long MILLIS_IN_MINUTE = 60_000L;
    private static final int MIN_SECRET_LENGTH = 32;

    private final Environment env;

    private String tokenSecret;
    private int tokenExpirationMinutes;

    private String authCookieName;
    private int authCookieMaxAgeSeconds;
    private boolean authCookieSecure;
    private String authCookieSameSite;

    private String racePlayerCookieName;
    private int racePlayerCookieMaxAgeSeconds;

    public TokenConfig(Environment env) {
        this.env = env;
    }

    @PostConstruct
    public void init() {
        this.tokenSecret = env.getProperty(ConfigPropertyKeys.TOKEN_SECRET);

        this.tokenExpirationMinutes = env.getProperty(
                ConfigPropertyKeys.TOKEN_EXPIRATION_MINUTES,
                Integer.class,
                DEFAULT_TOKEN_EXPIRATION_MINUTES
        );

        this.authCookieName = env.getProperty(
                ConfigPropertyKeys.AUTH_COOKIE_NAME,
                DEFAULT_COOKIE_NAME
        );

        this.authCookieMaxAgeSeconds = env.getProperty(
                ConfigPropertyKeys.AUTH_COOKIE_MAX_AGE_SECONDS,
                Integer.class,
                tokenExpirationMinutes * SECONDS_IN_MINUTE
        );

        this.authCookieSecure = env.getProperty(
                ConfigPropertyKeys.AUTH_COOKIE_SECURE,
                Boolean.class,
                DEFAULT_COOKIE_SECURE
        );

        this.authCookieSameSite = env.getProperty(
                ConfigPropertyKeys.AUTH_COOKIE_SAME_SITE,
                DEFAULT_COOKIE_SAME_SITE
        );

        this.racePlayerCookieName = env.getProperty(
                ConfigPropertyKeys.RACE_PLAYER_COOKIE_NAME,
                DEFAULT_RACE_PLAYER_COOKIE_NAME
        );

        this.racePlayerCookieMaxAgeSeconds = env.getProperty(
                ConfigPropertyKeys.RACE_PLAYER_COOKIE_MAX_AGE_SECONDS,
                Integer.class,
                authCookieMaxAgeSeconds
        );

        validate();
    }

    private void validate() {
        if (tokenSecret == null || tokenSecret.length() < MIN_SECRET_LENGTH) {
            throw new ConfigurationException(
                    ConfigPropertyKeys.TOKEN_SECRET
                            + " must be at least "
                            + MIN_SECRET_LENGTH
                            + " characters long"
            );
        }

        if (tokenExpirationMinutes <= 0) {
            throw new ConfigurationException(
                    ConfigPropertyKeys.TOKEN_EXPIRATION_MINUTES
                            + MUST_BE_POSITIVE_CURRENT_VALUE
                            + tokenExpirationMinutes
            );
        }

        if (authCookieName == null || authCookieName.isBlank()) {
            throw new ConfigurationException(
                    ConfigPropertyKeys.AUTH_COOKIE_NAME + MUST_NOT_BE_EMPTY
            );
        }

        if (authCookieMaxAgeSeconds <= 0) {
            throw new ConfigurationException(
                    ConfigPropertyKeys.AUTH_COOKIE_MAX_AGE_SECONDS
                            + MUST_BE_POSITIVE_CURRENT_VALUE
                            + authCookieMaxAgeSeconds
            );
        }

        if (authCookieSameSite == null || authCookieSameSite.isBlank()) {
            throw new ConfigurationException(
                    ConfigPropertyKeys.AUTH_COOKIE_SAME_SITE + MUST_NOT_BE_EMPTY
            );
        }

        if (racePlayerCookieName == null || racePlayerCookieName.isBlank()) {
            throw new ConfigurationException(
                    ConfigPropertyKeys.RACE_PLAYER_COOKIE_NAME + MUST_NOT_BE_EMPTY
            );
        }

        if (racePlayerCookieMaxAgeSeconds <= 0) {
            throw new ConfigurationException(
                    ConfigPropertyKeys.RACE_PLAYER_COOKIE_MAX_AGE_SECONDS
                            +MUST_BE_POSITIVE_CURRENT_VALUE
                            + racePlayerCookieMaxAgeSeconds
            );
        }
    }

    public long getTokenExpirationMillis() {
        return tokenExpirationMinutes * MILLIS_IN_MINUTE;
    }
}
