package com.quiz_wheelz.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class LoginResult {

    private String token;
    private AuthUserResponse user;
}