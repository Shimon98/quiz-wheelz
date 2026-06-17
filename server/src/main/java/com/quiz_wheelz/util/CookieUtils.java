package com.quiz_wheelz.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;

@Component
public class CookieUtils {

    private final String cookieName;
    private final int cookieMaxAgeSeconds;
    private final boolean secure;
    private final String sameSite;

    public CookieUtils(
            @Value("${app.auth.cookie-name}") String cookieName,
            @Value("${app.auth.cookie-max-age-seconds}") int cookieMaxAgeSeconds,
            @Value("${app.auth.cookie-secure}") boolean secure,
            @Value("${app.auth.cookie-same-site}") String sameSite
    ) {
        this.cookieName = cookieName;
        this.cookieMaxAgeSeconds = cookieMaxAgeSeconds;
        this.secure = secure;
        this.sameSite = sameSite;
    }

    public void addAuthCookie(HttpServletResponse response, String token) {
        String cookieHeader = buildCookieHeader(token, cookieMaxAgeSeconds);
        response.addHeader("Set-Cookie", cookieHeader);
    }

    public void clearAuthCookie(HttpServletResponse response) {
        String cookieHeader = buildCookieHeader("", 0);
        response.addHeader("Set-Cookie", cookieHeader);
    }

    public Optional<String> getAuthCookieValue(HttpServletRequest request) {
        return getCookieValue(request, cookieName);
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

    private String buildCookieHeader(String value, int maxAge) {
        StringBuilder cookie = new StringBuilder();

        cookie.append(cookieName)
                .append("=")
                .append(value)
                .append("; Path=/")
                .append("; Max-Age=")
                .append(maxAge)
                .append("; HttpOnly")
                .append("; SameSite=")
                .append(sameSite);

        if (secure) {
            cookie.append("; Secure");
        }

        return cookie.toString();
    }
}