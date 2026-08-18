package com.quiz_wheelz.config;

import com.quiz_wheelz.common.AppConstants;
import com.quiz_wheelz.exception.ConfigurationException;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.time.Clock;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.Objects;
import java.util.TimeZone;

/**
 * The single owner of application time: one configured {@link ZoneId} and one
 * shared {@link Clock} bean. Correctness-sensitive services inject the Clock
 * instead of creating {@code Clock.systemDefaultZone()} themselves, so tests
 * can pin time with {@code Clock.fixed(...)} and every service agrees on
 * "now".
 *
 * The durable MySQL model still stores zone-less LocalDateTime values that
 * were always written in local Israel time (the dev JDBC URL already pins
 * serverTimezone=Asia/Jerusalem), so the application zone defaults to
 * Asia/Jerusalem rather than silently reinterpreting existing rows as UTC.
 * A future migration of the DB model to Instant/UTC is separate production
 * work.
 */
@Configuration
public class TimeConfig {

    private final Environment env;

    private ZoneId applicationZoneId;

    public TimeConfig(Environment env) {
        this.env = Objects.requireNonNull(env);
    }

    @PostConstruct
    void init() {
        String configuredZone = env.getProperty(
                ConfigPropertyKeys.QUIZWHEELZ_TIME_ZONE,
                AppConstants.DEFAULT_TIME_ZONE
        );

        try {
            this.applicationZoneId = ZoneId.of(configuredZone);
        } catch (DateTimeException exception) {
            throw new ConfigurationException(
                    "Invalid " + ConfigPropertyKeys.QUIZWHEELZ_TIME_ZONE
                            + ": " + configuredZone
            );
        }

        /*
         * Compatibility bridge: legacy code (BaseEntity callbacks, static
         * ApiResponse/ErrorResponse factories) still calls LocalDateTime.now()
         * directly. Aligning the JVM default zone keeps those calls
         * deterministic across Windows/Linux/Docker hosts. New
         * correctness-sensitive services must use the injected Clock.
         */
        TimeZone.setDefault(TimeZone.getTimeZone(applicationZoneId));
    }

    @Bean
    public ZoneId applicationZoneId() {
        return applicationZoneId;
    }

    @Bean
    public Clock applicationClock(ZoneId applicationZoneId) {
        return Clock.system(applicationZoneId);
    }
}
