package com.quiz_wheelz.service;

import com.quiz_wheelz.dto.auth.AuthUserResponse;
import com.quiz_wheelz.dto.auth.LoginRequest;
import com.quiz_wheelz.dto.auth.LoginResult;
import com.quiz_wheelz.entitys.User;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.exception.AuthMessages;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserService userService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResult login(LoginRequest request) {
        User user = userService.findByUsernameForLoginOrThrow(request.getUsername());

        userService.validateUserIsActive(user);
        validatePassword(request.getPassword(), user.getPasswordHash());

        String token = createTokenForUser(user);
        AuthUserResponse authUserResponse = AuthUserResponse.from(user);

        return new LoginResult(token, authUserResponse);
    }

    @Transactional(readOnly = true)
    public AuthUserResponse getCurrentUser(String token) {
        validateTokenExists(token);
        validateTokenIsValid(token);

        Long userId = jwtService.extractUserId(token);
        User user = userService.findActiveByIdOrThrow(userId);

        return AuthUserResponse.from(user);
    }

    private void validatePassword(String rawPassword, String encodedPassword) {
        boolean passwordMatches = passwordEncoder.matches(rawPassword, encodedPassword);

        if (!passwordMatches) {
            throw new ApiException(
                    ErrorCode.UNAUTHORIZED,
                    AuthMessages.INVALID_USERNAME_OR_PASSWORD
            );
        }
    }

    private void validateTokenExists(String token) {
        if (token == null || token.isBlank()) {
            throw new ApiException(
                    ErrorCode.UNAUTHORIZED,
                    AuthMessages.MISSING_AUTH_TOKEN
            );
        }
    }

    private void validateTokenIsValid(String token) {
        if (!jwtService.isTokenValid(token)) {
            throw new ApiException(ErrorCode.INVALID_TOKEN);
        }
    }

    private String createTokenForUser(User user) {
        return jwtService.createToken(
                user.getId(),
                user.getUsername(),
                user.getRole().name()
        );
    }
}