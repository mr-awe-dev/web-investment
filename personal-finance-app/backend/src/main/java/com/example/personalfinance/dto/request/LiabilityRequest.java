package com.example.personalfinance.dto.request;

import com.example.personalfinance.domain.liability.LiabilityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LiabilityRequest(@NotBlank String name, String creditor, @NotNull LiabilityType liabilityType,
                               @NotBlank @Size(min = 3, max = 3) String currency, @PositiveOrZero BigDecimal interestRate,
                               Integer tenorMonths, BigDecimal installment, LocalDate dueDate) {}
