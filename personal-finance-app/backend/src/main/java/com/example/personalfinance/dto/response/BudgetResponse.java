package com.example.personalfinance.dto.response;

import java.math.BigDecimal;

public record BudgetResponse(Long id, Long categoryId, String categoryCode, String categoryName, String periodMonth,
                             BigDecimal amount, BigDecimal actual, BigDecimal remaining, String status) {}
