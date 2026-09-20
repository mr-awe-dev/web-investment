package com.example.personalfinance.dto.response;

import java.math.BigDecimal;

/** Generic labelled amount used by report breakdowns. */
public record LineItem(String code, String label, BigDecimal amount) {}
