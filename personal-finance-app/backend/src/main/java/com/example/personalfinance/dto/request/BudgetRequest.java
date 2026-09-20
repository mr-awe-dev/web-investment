package com.example.personalfinance.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record BudgetRequest(@NotNull Long categoryId, @NotNull @Pattern(regexp = "\\d{4}-\\d{2}") String periodMonth, @NotNull @Positive BigDecimal amount) {}
