package com.quiz_wheelz.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // User errors: 1000-1999
    USER_NOT_FOUND(1000, "User not found", HttpStatus.NOT_FOUND),
    USERNAME_ALREADY_EXISTS(1001, "Username already exists", HttpStatus.CONFLICT),
    USER_INACTIVE(1002, "User is inactive", HttpStatus.FORBIDDEN),

    // Auth errors: 2000-2999
    INVALID_TOKEN(2000, "Invalid token", HttpStatus.UNAUTHORIZED),
    TOKEN_EXPIRED(2001, "Token expired", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(2002, "Unauthorized", HttpStatus.UNAUTHORIZED),
    FORBIDDEN(2003, "Forbidden", HttpStatus.FORBIDDEN),

    // Request / validation errors: 3000-3999
    VALIDATION_ERROR(3000, "Validation error", HttpStatus.BAD_REQUEST),
    BAD_REQUEST(3001, "Bad request", HttpStatus.BAD_REQUEST),
    SUBJECT_NOT_FOUND(3002, "Active subject not found", HttpStatus.NOT_FOUND),
    ROOM_CODE_GENERATION_FAILED(3003, "Could not generate unique room code", HttpStatus.INTERNAL_SERVER_ERROR),

    // System errors: 9000-9999
    INTERNAL_ERROR(9999, "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR);

    private final int code;
    private final String defaultMessage;
    private final HttpStatus status;

    ErrorCode(int code, String defaultMessage, HttpStatus status) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.status = status;
    }
}