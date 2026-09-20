package com.example.personalfinance.exception;

import org.springframework.http.HttpStatus;

/** 400 – a business rule was violated (e.g. missing field for a transaction type). */
public class BusinessException extends ApiException {
    public BusinessException(String code, String message) {
        super(HttpStatus.BAD_REQUEST, code, message);
    }
}
