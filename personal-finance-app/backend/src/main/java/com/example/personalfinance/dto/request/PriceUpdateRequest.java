package com.example.personalfinance.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Market price update – affects unrealized P/L only. */
public record PriceUpdateRequest(@NotNull @PositiveOrZero BigDecimal currentPrice, @NotNull LocalDate valuationDate) {}
