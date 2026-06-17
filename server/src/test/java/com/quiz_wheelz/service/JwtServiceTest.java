package com.quiz_wheelz.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    @Test
    void shouldCreateValidateAndExtractClaimsFromToken() {
        JwtService jwtService = new JwtService(
                "CHANGE_ME_TO_A_LONG_SECRET_KEY_AT_LEAST_32_CHARS",
                86400000
        );

        String token = jwtService.createToken(1L, "teacher1", "TEACHER");

        assertTrue(jwtService.isTokenValid(token));
        assertEquals("teacher1", jwtService.extractUsername(token));
        assertEquals(1L, jwtService.extractUserId(token));
        assertEquals("TEACHER", jwtService.extractRole(token));
    }
}