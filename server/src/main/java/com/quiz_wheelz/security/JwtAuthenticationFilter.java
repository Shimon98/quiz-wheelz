package com.quiz_wheelz.security;

import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.service.auth.JwtService;
import com.quiz_wheelz.service.auth.UserService;
import com.quiz_wheelz.utils.CookieUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final CookieUtils cookieUtils;
    private final JwtService jwtService;
    private final UserService userService;
    private final SecurityContextRepository securityContextRepository =
            new RequestAttributeSecurityContextRepository();

    public JwtAuthenticationFilter(
            CookieUtils cookieUtils,
            JwtService jwtService,
            UserService userService
    ) {
        this.cookieUtils = cookieUtils;
        this.jwtService = jwtService;
        this.userService = userService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            authenticateRequestIfTokenExists(request, response);
        } catch (RuntimeException exception) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private void authenticateRequestIfTokenExists(HttpServletRequest request, HttpServletResponse response) {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            return;
        }

        Optional<String> tokenOptional = cookieUtils.getAuthCookieValue(request);

        if (tokenOptional.isEmpty()) {
            return;
        }

        String token = tokenOptional.get();

        if (!jwtService.isTokenValid(token)) {
            SecurityContextHolder.clearContext();
            return;
        }

        Long userId = jwtService.extractUserId(token);
        User user = userService.findActiveByIdOrThrow(userId);

        AuthUserPrincipal principal = AuthUserPrincipal.from(user);

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        principal.getAuthorities()
                );

        authentication.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request)
        );

        // Long-lived responses such as the teacher SSE stream finish with a second servlet dispatch of
        // type ASYNC. OncePerRequestFilter skips this filter on that dispatch, and Spring Security then
        // reloads the context from the request-scoped repository used by the STATELESS chain. Without
        // this save the ASYNC dispatch runs anonymous, /api/** rejects it on an already committed
        // response, and the request ends in a security error instead of completing normally.
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }
}