package com.quiz_wheelz.config;

import com.quiz_wheelz.common.AppConstants;
import com.quiz_wheelz.exception.ConfigurationException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.time.Clock;
import java.time.ZoneId;
import java.util.TimeZone;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TimeConfigTest {

    // TimeConfig.init() mutates the GLOBAL JVM default timezone — restore it
    // so no other test depends on execution order.
    private TimeZone originalTimeZone;

    @BeforeEach
    void rememberDefaultTimeZone() {
        originalTimeZone = TimeZone.getDefault();
    }

    @AfterEach
    void restoreDefaultTimeZone() {
        TimeZone.setDefault(originalTimeZone);
    }

    @Test
    void shouldDefaultToApplicationTimeZone() {
        TimeConfig timeConfig = new TimeConfig(new MockEnvironment());
        timeConfig.init();

        assertEquals(
                ZoneId.of(AppConstants.DEFAULT_TIME_ZONE),
                timeConfig.applicationZoneId()
        );
    }

    @Test
    void shouldUseConfiguredTimeZone() {
        MockEnvironment env = new MockEnvironment()
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_TIME_ZONE, "UTC");

        TimeConfig timeConfig = new TimeConfig(env);
        timeConfig.init();

        assertEquals(ZoneId.of("UTC"), timeConfig.applicationZoneId());
        // The legacy-compatibility JVM bridge follows the configured zone.
        assertEquals(ZoneId.of("UTC"), TimeZone.getDefault().toZoneId());
    }

    @Test
    void clockShouldRunInTheConfiguredZone() {
        TimeConfig timeConfig = new TimeConfig(new MockEnvironment());
        timeConfig.init();

        Clock clock = timeConfig.applicationClock(timeConfig.applicationZoneId());

        assertEquals(ZoneId.of(AppConstants.DEFAULT_TIME_ZONE), clock.getZone());
    }

    @Test
    void invalidConfiguredTimeZoneShouldFailFast() {
        MockEnvironment env = new MockEnvironment()
                .withProperty(ConfigPropertyKeys.QUIZWHEELZ_TIME_ZONE, "Not/AZone");

        TimeConfig timeConfig = new TimeConfig(env);

        assertThrows(ConfigurationException.class, timeConfig::init);
    }
}
