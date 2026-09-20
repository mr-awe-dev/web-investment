package com.example.personalfinance.dto.request;

import com.example.personalfinance.domain.bond.CouponFrequency;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BondRequest(@NotNull Long assetId, String issuer, String bondType, @NotNull @Positive BigDecimal nominalValue,
                          @NotNull @Positive BigDecimal couponRate, @PositiveOrZero BigDecimal taxRate, @NotNull CouponFrequency frequency,
                          @NotNull LocalDate settlementDate, @NotNull LocalDate maturityDate) {}
