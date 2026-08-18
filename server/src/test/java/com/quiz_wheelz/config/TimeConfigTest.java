package com.quiz_wheelz.config;

import com.quiz_wheelz.common.AppConstants;
import com.quiz_wheelz.exception.ConfigurationException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.time.Clock;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TimeConfigTest {

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
