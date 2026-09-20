package com.example.personalfinance.domain.bond;

/** Coupon payment frequency with payments per year. */
public enum CouponFrequency {
    MONTHLY(12), QUARTERLY(4), SEMI_ANNUAL(2), ANNUAL(1);

    private final int perYear;

    CouponFrequency(int perYear) { this.perYear = perYear; }

    public int perYear() { return perYear; }

    public int months() { return 12 / perYear; }
}
