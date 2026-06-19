package com.quiz_wheelz.service;

import com.quiz_wheelz.config.TokenConfig;
import com.quiz_wheelz.security.JwtClaims;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

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
        Date now = new Date();
        Date expirationDate = new Date(
                now.getTime() + tokenConfig.getTokenExpirationMillis()
        );

        return Jwts.builder()
                .subject(username)
                .claim(JwtClaims.USER_ID, userId)
                .claim(JwtClaims.ROLE, role)
                .issuedAt(now)
                .expiration(expirationDate)
                .signWith(secretKey)
                .compact();
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

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}