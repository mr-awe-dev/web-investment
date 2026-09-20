package com.example.personalfinance.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/** Base class for business exceptions rendered as a consistent API error payload. */
@Getter
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;

    public ApiException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
