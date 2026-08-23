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
