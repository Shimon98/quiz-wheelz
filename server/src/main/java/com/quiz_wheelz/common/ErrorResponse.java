package com.quiz_wheelz.common;

import com.quiz_wheelz.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {

    private boolean success;

    // numeric internal error code, for example: 1000, 2000, 3000
    private int code;

    // enum name, for example: USER_NOT_FOUND
    private String error;

    // readable message for the client
    private String message;

    // HTTP status code, for example: 404
    private int status;

    // request path, for example: /api/users/5
    private String path;

    private LocalDateTime timestamp;

    // only used for validation errors
    private Map<String, String> validationErrors;


    public static ErrorResponse from(ErrorCode errorCode, String message, String path) {
        return ErrorResponse.builder()
                .success(false)
                .code(errorCode.getCode())
                .error(errorCode.name())
                .message(message)
                .status(errorCode.getStatus().value())
                .path(path)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ErrorResponse from(ErrorCode errorCode, String path) {
        return from(errorCode, errorCode.getDefaultMessage(), path);
    }

    public static ErrorResponse validation(
            ErrorCode errorCode,
            String path,
            Map<String, String> validationErrors
    ) {
        return ErrorResponse.builder()
                .success(false)
                .code(errorCode.getCode())
                .error(errorCode.name())
                .message(errorCode.getDefaultMessage())
                .status(errorCode.getStatus().value())
                .path(path)
                .timestamp(LocalDateTime.now())
                .validationErrors(validationErrors)
                .build();
    }
}