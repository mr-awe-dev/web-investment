package com.example.personalfinance.dto.response;

import java.time.LocalDateTime;

/** Uniform API envelope shared by successful and failed responses. */
public record ApiResponse<T>(boolean success, T data, String message, String code, LocalDateTime timestamp) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, null, null, LocalDateTime.now());
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(false, null, message, code, LocalDateTime.now());
    }
}
