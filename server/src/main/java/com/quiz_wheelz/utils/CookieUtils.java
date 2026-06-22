package com.quiz_wheelz.utils;

import com.quiz_wheelz.config.TokenConfig;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;

@Component
public class CookieUtils {

    private final TokenConfig tokenConfig;

    public CookieUtils(TokenConfig tokenConfig) {
        this.tokenConfig = tokenConfig;
    }

    public void addAuthCookie(HttpServletResponse response, String token) {
        String cookieHeader = buildCookieHeader(
                tokenConfig.getAuthCookieName(),
                token,
                tokenConfig.getAuthCookieMaxAgeSeconds()
        );

        response.addHeader(HttpHeaders.SET_COOKIE, cookieHeader);
    }

    public void clearAuthCookie(HttpServletResponse response) {
        String cookieHeader = buildCookieHeader(
                tokenConfig.getAuthCookieName(),
                CookieConstants.EMPTY_VALUE,
                0
        );
        response.addHeader(HttpHeaders.SET_COOKIE, cookieHeader);
    }

    public Optional<String> getAuthCookieValue(HttpServletRequest request) {
        return getCookieValue(request, tokenConfig.getAuthCookieName());
    }

    public void addRacePlayerCookie(HttpServletResponse response, String token) {
        String cookieHeader = buildCookieHeader(
                tokenConfig.getRacePlayerCookieName(),
                token,
                tokenConfig.getRacePlayerCookieMaxAgeSeconds()
        );

        response.addHeader(HttpHeaders.SET_COOKIE, cookieHeader);
    }

    public void clearRacePlayerCookie(HttpServletResponse response) {
        String cookieHeader = buildCookieHeader(
                tokenConfig.getRacePlayerCookieName(),
                CookieConstants.EMPTY_VALUE,
                0
        );

        response.addHeader(HttpHeaders.SET_COOKIE, cookieHeader);
    }

    public Optional<String> getRacePlayerCookieValue(HttpServletRequest request) {
        return getCookieValue(request, tokenConfig.getRacePlayerCookieName());
    }

    public Optional<String> getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }

        return Arrays.stream(request.getCookies())
                .filter(cookie -> name.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    private String buildCookieHeader(String name, String value, int maxAge) {
        StringBuilder cookie = new StringBuilder();

        cookie.append(name)
                .append("=")
                .append(value)
                .append(CookieConstants.PATH_ROOT_ATTRIBUTE)
                .append(CookieConstants.MAX_AGE_ATTRIBUTE)
                .append(maxAge)
                .append(CookieConstants.HTTP_ONLY_ATTRIBUTE)
                .append(CookieConstants.SAME_SITE_ATTRIBUTE)
                .append(tokenConfig.getAuthCookieSameSite());

        if (tokenConfig.isAuthCookieSecure()) {
            cookie.append(CookieConstants.SECURE_ATTRIBUTE);
        }

        return cookie.toString();
    }
}
