package com.example.personalfinance.domain.common;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Money helpers: every monetary value is a BigDecimal with scale 2, HALF_UP. */
public final class Money {
    public static final int SCALE = 2;
    public static final BigDecimal ZERO = BigDecimal.ZERO.setScale(SCALE, RoundingMode.HALF_UP);

    private Money() {}

    /** Null-safe normalisation to monetary scale. */
    public static BigDecimal of(BigDecimal v) {
        return v == null ? ZERO : v.setScale(SCALE, RoundingMode.HALF_UP);
    }

    public static BigDecimal mul(BigDecimal a, BigDecimal b) {
        return of(a.multiply(b));
    }
}
