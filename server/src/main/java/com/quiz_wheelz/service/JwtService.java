package com.quiz_wheelz.service;

import com.quiz_wheelz.config.TokenConfig;
import com.quiz_wheelz.security.JwtClaims;
import com.quiz_wheelz.security.JwtSubjects;
import com.quiz_wheelz.security.JwtTokenTypes;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class JwtService {

    private final TokenConfig tokenConfig;
    private final SecretKey secretKey;

    public JwtService(TokenConfig tokenConfig) {
        this.tokenConfig = tokenConfig;
        this.secretKey = Keys.hmacShaKeyFor(
                tokenConfig.getTokenSecret().getBytes(StandardCharsets.UTF_8)
        );
    }

    public String createToken(Long userId, String username, String role) {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put(JwtClaims.TOKEN_TYPE, JwtTokenTypes.AUTH_USER);
        claims.put(JwtClaims.USER_ID, userId);
        claims.put(JwtClaims.ROLE, role);

        return createSignedToken(username, claims);
    }

    public String createRacePlayerToken(Long raceId, Long racePlayerId, String displayName) {
        Map<String, Object> claims = new LinkedHashMap<>();
        claims.put(JwtClaims.TOKEN_TYPE, JwtTokenTypes.RACE_PLAYER);
        claims.put(JwtClaims.RACE_ID, raceId);
        claims.put(JwtClaims.RACE_PLAYER_ID, racePlayerId);
        claims.put(JwtClaims.DISPLAY_NAME, displayName);

        return createSignedToken(JwtSubjects.racePlayerSubject(racePlayerId), claims);
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = extractAllClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        Number userId = extractAllClaims(token).get(JwtClaims.USER_ID, Number.class);
        return userId.longValue();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get(JwtClaims.ROLE, String.class);
    }

    public String extractTokenType(String token) {
        return extractAllClaims(token).get(JwtClaims.TOKEN_TYPE, String.class);
    }

    public Long extractRaceId(String token) {
        Number raceId = extractAllClaims(token).get(JwtClaims.RACE_ID, Number.class);
        return raceId.longValue();
    }

    public Long extractRacePlayerId(String token) {
        Number racePlayerId = extractAllClaims(token).get(JwtClaims.RACE_PLAYER_ID, Number.class);
        return racePlayerId.longValue();
    }

    private String createSignedToken(String subject, Map<String, Object> claims) {
        Date now = new Date();
        Date expirationDate = new Date(
                now.getTime() + tokenConfig.getTokenExpirationMillis()
        );

        JwtBuilder builder = Jwts.builder().subject(subject);
        claims.forEach(builder::claim);

        return builder
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(secretKey)
                .compact();
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
