package com.quiz_wheelz.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultBootstrapContext;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.core.env.AbstractEnvironment;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.io.DefaultResourceLoader;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Luck and Hidden Recovery are part of every normal run of the project. Each way the server starts is loaded here the
// way Spring Boot loads it (application.properties, spring.profiles.default, the profile file, then an environment
// variable above them all), without the machine's own environment, and the effective values are read back.
class GameplayFeatureEffectiveConfigTest {
    // A stock MySQL 8 (a local service or the Docker image) allows 151 connections. The running server checks the
    // real @@max_connections itself (LuckStartupVerifier); this only keeps the shipped default inside a stock install.
    private static final int STOCK_MYSQL_MAX_CONNECTIONS = 151;

    @Test
    void aNormalRunLoadsTheDevProfileWithLuckAndRecoveryOnAndABudgetTheLuckGateAccepts() {
        ConfigurableEnvironment environment = load(Map.of());

        assertEquals("update", environment.getProperty("spring.jpa.hibernate.ddl-auto"), "the dev profile is the normal run");
        assertEquals(Boolean.TRUE, flag(environment, ConfigPropertyKeys.QUIZWHEELZ_LUCK_ANSWER_ENABLED));
        assertEquals(Boolean.TRUE, flag(environment, ConfigPropertyKeys.QUIZWHEELZ_RECOVERY_ENABLED));
        int instances = number(environment, ConfigPropertyKeys.QUIZWHEELZ_DB_MAX_APPLICATION_INSTANCES);
        int writer = number(environment, "spring.datasource.hikari.maximum-pool-size");
        int peer = number(environment, ConfigPropertyKeys.QUIZWHEELZ_LUCK_PEER_POOL_MAX_SIZE);
        int budget = number(environment, ConfigPropertyKeys.QUIZWHEELZ_DB_APPLICATION_CONNECTION_BUDGET);
        int reserved = number(environment, ConfigPropertyKeys.QUIZWHEELZ_DB_RESERVED_CONNECTIONS);
        assertTrue(instances > 0 && reserved > 0, "the Luck gate refuses undeclared limits");
        assertTrue(instances * (writer + peer) <= budget, "instances x (writer + Luck pool) <= budget");
        assertTrue(budget + reserved <= STOCK_MYSQL_MAX_CONNECTIONS, "budget + reserved fits a stock MySQL");
    }

    @Test
    void anEnvironmentVariableSwitchesLuckOffAndLeavesRecoveryOn() {
        ConfigurableEnvironment environment = load(Map.of(ConfigPropertyKeys.QUIZWHEELZ_LUCK_ANSWER_ENABLED, "false"));

        assertEquals(Boolean.FALSE, flag(environment, ConfigPropertyKeys.QUIZWHEELZ_LUCK_ANSWER_ENABLED));
        assertEquals(Boolean.TRUE, flag(environment, ConfigPropertyKeys.QUIZWHEELZ_RECOVERY_ENABLED));
    }

    @Test
    void anEnvironmentVariableSwitchesRecoveryOffAndLeavesLuckOn() {
        ConfigurableEnvironment environment = load(Map.of(ConfigPropertyKeys.QUIZWHEELZ_RECOVERY_ENABLED, "false"));

        assertEquals(Boolean.TRUE, flag(environment, ConfigPropertyKeys.QUIZWHEELZ_LUCK_ANSWER_ENABLED));
        assertEquals(Boolean.FALSE, flag(environment, ConfigPropertyKeys.QUIZWHEELZ_RECOVERY_ENABLED));
    }

    @Test
    void theTestProfileStartsWithBothFeaturesOff() {
        ConfigurableEnvironment environment = load(Map.of(), "test");

        assertEquals(Boolean.FALSE, flag(environment, ConfigPropertyKeys.QUIZWHEELZ_LUCK_ANSWER_ENABLED));
        assertEquals(Boolean.FALSE, flag(environment, ConfigPropertyKeys.QUIZWHEELZ_RECOVERY_ENABLED));
    }

    @Test
    void theProdProfileKeepsBothFeaturesOffAndInheritsNoLocalBudget() {
        ConfigurableEnvironment environment = load(Map.of(), "prod");

        assertEquals(Boolean.FALSE, flag(environment, ConfigPropertyKeys.QUIZWHEELZ_LUCK_ANSWER_ENABLED));
        assertEquals(Boolean.FALSE, flag(environment, ConfigPropertyKeys.QUIZWHEELZ_RECOVERY_ENABLED));
        assertNull(environment.getProperty(ConfigPropertyKeys.QUIZWHEELZ_DB_MAX_APPLICATION_INSTANCES));
        assertNull(environment.getProperty(ConfigPropertyKeys.QUIZWHEELZ_DB_APPLICATION_CONNECTION_BUDGET));
        assertNull(environment.getProperty(ConfigPropertyKeys.QUIZWHEELZ_DB_RESERVED_CONNECTIONS));
    }

    private static ConfigurableEnvironment load(Map<String, Object> environmentVariables, String... profiles) {
        // No system properties and no OS environment of the machine running the tests: only what is passed here.
        ConfigurableEnvironment environment = new AbstractEnvironment() {
        };
        environment.getPropertySources().addFirst(new MapPropertySource("environmentVariables", environmentVariables));
        ConfigDataEnvironmentPostProcessor.applyTo(environment, new DefaultResourceLoader(), new DefaultBootstrapContext(),
                profiles);
        return environment;
    }

    private static Boolean flag(ConfigurableEnvironment environment, String key) {
        return environment.getProperty(key, Boolean.class);
    }

    private static int number(ConfigurableEnvironment environment, String key) {
        Integer value = environment.getProperty(key, Integer.class);
        assertTrue(value != null, key + " is declared");
        return value;
    }
}
