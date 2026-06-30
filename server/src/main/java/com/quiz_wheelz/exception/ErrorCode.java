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

    RACE_NOT_FOUND(3004, "Race not found", HttpStatus.NOT_FOUND),
    RACE_NOT_JOINABLE(3005, ErrorMessages.RACE_NOT_JOINABLE, HttpStatus.CONFLICT),
    RACE_FULL(3006, ErrorMessages.RACE_FULL, HttpStatus.CONFLICT),
    RACE_PLAYER_NAME_TAKEN(3007, ErrorMessages.RACE_PLAYER_NAME_TAKEN, HttpStatus.CONFLICT),
    RACE_CANNOT_START_WITHOUT_PLAYERS(3008, ErrorMessages.RACE_CANNOT_START_WITHOUT_PLAYERS, HttpStatus.CONFLICT),
    RACE_CANNOT_START_IN_CURRENT_STATUS(3009, ErrorMessages.RACE_CANNOT_START_IN_CURRENT_STATUS, HttpStatus.CONFLICT),

    QUESTION_TEMPLATE_NOT_FOUND(3010, ErrorMessages.QUESTION_TEMPLATE_NOT_FOUND, HttpStatus.NOT_FOUND),
    QUESTION_TYPE_NOT_SUPPORTED(3011, ErrorMessages.QUESTION_TYPE_NOT_SUPPORTED, HttpStatus.CONFLICT),
    QUESTION_GENERATION_FAILED(3012, ErrorMessages.QUESTION_GENERATION_FAILED, HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_QUESTION_TEMPLATE_CONFIG(3013, ErrorMessages.INVALID_QUESTION_TEMPLATE_CONFIG, HttpStatus.CONFLICT),
    RACE_PLAYER_TOKEN_MISSING(3014, ErrorMessages.RACE_PLAYER_TOKEN_MISSING, HttpStatus.UNAUTHORIZED),
    INVALID_RACE_PLAYER_TOKEN(3015, ErrorMessages.INVALID_RACE_PLAYER_TOKEN, HttpStatus.UNAUTHORIZED),
    RACE_PLAYER_NOT_FOUND(3016, ErrorMessages.RACE_PLAYER_NOT_FOUND, HttpStatus.NOT_FOUND),
    RACE_PLAYER_NOT_RACING(3017, ErrorMessages.RACE_PLAYER_NOT_RACING, HttpStatus.CONFLICT),
    QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER(3018, ErrorMessages.QUESTION_TEMPLATE_NOT_AVAILABLE_FOR_PLAYER, HttpStatus.CONFLICT),
    RACE_NOT_IN_PROGRESS(3019, ErrorMessages.RACE_NOT_IN_PROGRESS, HttpStatus.CONFLICT),


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
