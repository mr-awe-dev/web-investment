package com.example.personalfinance.exception;

/** Raised when a sale requests more quantity than the open lots can supply. */
public class InsufficientQuantityException extends BusinessException {
    public InsufficientQuantityException() {
        super("INSUFFICIENT_STOCK", "Kuantitas tersedia tidak mencukupi untuk penjualan");
    }
}
