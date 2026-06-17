package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.auth.AuthUserResponse;
import com.quiz_wheelz.dto.auth.LoginRequest;
import com.quiz_wheelz.dto.auth.LoginResult;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.service.AuthService;
import com.quiz_wheelz.utils.CookieUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final CookieUtils cookieUtils;

    public AuthController(AuthService authService, CookieUtils cookieUtils) {
        this.authService = authService;
        this.cookieUtils = cookieUtils;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthUserResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        LoginResult loginResult = authService.login(request);

        cookieUtils.addAuthCookie(response, loginResult.getToken());

        return ResponseEntity.ok(
                ApiResponse.ok("Login successful", loginResult.getUser())
        );
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthUserResponse>> me(HttpServletRequest request) {
        String token = extractAuthTokenOrThrow(request);

        AuthUserResponse currentUser = authService.getCurrentUser(token);

        return ResponseEntity.ok(
                ApiResponse.ok("Current user loaded", currentUser)
        );
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        cookieUtils.clearAuthCookie(response);

        return ResponseEntity.ok(
                ApiResponse.ok("Logout successful")
        );
    }

    private String extractAuthTokenOrThrow(HttpServletRequest request) {
        return cookieUtils.getAuthCookieValue(request)
                .orElseThrow(() -> new ApiException(
                        ErrorCode.UNAUTHORIZED,
                        "Missing auth cookie"
                ));
    }
}