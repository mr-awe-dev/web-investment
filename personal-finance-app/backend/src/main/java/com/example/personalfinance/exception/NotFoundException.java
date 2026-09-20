package com.example.personalfinance.exception;

import org.springframework.http.HttpStatus;

/** 404 – the referenced resource does not exist or belongs to another user. */
public class NotFoundException extends ApiException {
    public NotFoundException(String what) {
        super(HttpStatus.NOT_FOUND, "NOT_FOUND", what + " tidak ditemukan");
    }
}
