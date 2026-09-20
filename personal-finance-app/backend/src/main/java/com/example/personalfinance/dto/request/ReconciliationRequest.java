package com.example.personalfinance.dto.request;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReconciliationRequest(@NotNull Long accountId, @NotNull LocalDate reconciliationDate, @NotNull BigDecimal actualBalance, String notes) {}
