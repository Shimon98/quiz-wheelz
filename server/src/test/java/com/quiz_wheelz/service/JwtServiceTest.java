package com.quiz_wheelz.service;

import com.quiz_wheelz.config.TokenConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        MockEnvironment env = new MockEnvironment();

        env.setProperty("TOKEN_SECRET", "CHANGE_ME_TO_A_LONG_SECRET_KEY_AT_LEAST_32_CHARS");
        env.setProperty("TOKEN_EXPIRATION_MINUTES", "120");
        env.setProperty("AUTH_COOKIE_NAME", "AUTH_TOKEN");
        env.setProperty("AUTH_COOKIE_MAX_AGE_SECONDS", "7200");
        env.setProperty("AUTH_COOKIE_SECURE", "false");
        env.setProperty("AUTH_COOKIE_SAME_SITE", "Lax");

        TokenConfig tokenConfig = new TokenConfig(env);
        tokenConfig.init();

        jwtService = new JwtService(tokenConfig);
    }

    @Test
    void shouldCreateValidateAndExtractClaimsFromToken() {
        String token = jwtService.createToken(1L, "teacher1", "TEACHER");

        assertNotNull(token);
        assertTrue(jwtService.isTokenValid(token));
        assertEquals("teacher1", jwtService.extractUsername(token));
        assertEquals(1L, jwtService.extractUserId(token));
        assertEquals("TEACHER", jwtService.extractRole(token));
    }
}