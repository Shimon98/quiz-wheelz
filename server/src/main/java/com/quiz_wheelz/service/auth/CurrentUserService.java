package com.quiz_wheelz.service.auth;

import com.quiz_wheelz.dto.auth.AuthUserResponse;
import com.quiz_wheelz.enums.UserRole;
import com.quiz_wheelz.exception.ApiException;
import com.quiz_wheelz.exception.ErrorCode;
import com.quiz_wheelz.security.AuthUserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    public AuthUserPrincipal getCurrentPrincipalOrThrow() {
        Authentication authentication = SecurityContextHolder
                .getContext()
                .getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        Object principal = authentication.getPrincipal();

        if (!(principal instanceof AuthUserPrincipal authUserPrincipal)) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        return authUserPrincipal;
    }

    public Long getCurrentUserId() {
        return getCurrentPrincipalOrThrow().getUserId();
    }

    public UserRole getCurrentUserRole() {
        return getCurrentPrincipalOrThrow().getRole();
    }

    public AuthUserResponse getCurrentUserResponse() {
        AuthUserPrincipal principal = getCurrentPrincipalOrThrow();

        return new AuthUserResponse(
                principal.getUserId(),
                principal.getUsername(),
                principal.getDisplayName(),
                principal.getRole().name()
        );
    }

    public void requireRole(UserRole requiredRole) {
        UserRole currentRole = getCurrentUserRole();

        if (currentRole != requiredRole) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
    }

    public void requireAnyRole(UserRole... allowedRoles) {
        UserRole currentRole = getCurrentUserRole();

        for (UserRole allowedRole : allowedRoles) {
            if (currentRole == allowedRole) {
                return;
            }
        }

        throw new ApiException(ErrorCode.FORBIDDEN);
    }
}