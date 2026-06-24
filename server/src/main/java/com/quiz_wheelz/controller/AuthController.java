package com.quiz_wheelz.controller;

import com.quiz_wheelz.common.ApiMessages;
import com.quiz_wheelz.common.ApiPaths;
import com.quiz_wheelz.common.ApiResponse;
import com.quiz_wheelz.dto.auth.AuthUserResponse;
import com.quiz_wheelz.dto.auth.LoginRequest;
import com.quiz_wheelz.dto.auth.LoginResult;
import com.quiz_wheelz.service.AuthService;
import com.quiz_wheelz.service.CurrentUserService;
import com.quiz_wheelz.utils.CookieUtils;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(ApiPaths.AUTH_BASE)
public class AuthController {

    private final AuthService authService;
    private final CurrentUserService currentUserService;
    private final CookieUtils cookieUtils;

    public AuthController(
            AuthService authService,
            CurrentUserService currentUserService,
            CookieUtils cookieUtils
    ) {
        this.authService = authService;
        this.currentUserService = currentUserService;
        this.cookieUtils = cookieUtils;
    }

    @PostMapping(ApiPaths.LOGIN)
    public ResponseEntity<ApiResponse<AuthUserResponse>> login(
            @Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        LoginResult loginResult = authService.login(request);

        cookieUtils.addAuthCookie(response, loginResult.getToken());

        return ResponseEntity.ok(
                ApiResponse.ok(ApiMessages.LOGIN_SUCCESSFUL, loginResult.getUser())
        );
    }

    @GetMapping(ApiPaths.ME)
    public ResponseEntity<ApiResponse<AuthUserResponse>> me() {
        AuthUserResponse currentUser = currentUserService.getCurrentUserResponse();

        return ResponseEntity.ok(
                ApiResponse.ok(ApiMessages.CURRENT_USER_LOADED, currentUser)
        );
    }

    @PostMapping(ApiPaths.LOGOUT)
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletResponse response) {
        cookieUtils.clearAuthCookie(response);

        return ResponseEntity.ok(
                ApiResponse.ok(ApiMessages.LOGOUT_SUCCESSFUL)
        );
    }
}