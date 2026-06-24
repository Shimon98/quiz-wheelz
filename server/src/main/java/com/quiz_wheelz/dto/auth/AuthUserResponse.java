package com.quiz_wheelz.dto.auth;

import com.quiz_wheelz.entitys.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthUserResponse {

    private Long id;
    private String username;
    private String displayName;
    private String role;

    public static AuthUserResponse from(User user) {
        return new AuthUserResponse(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getRole().name()
        );
    }
}