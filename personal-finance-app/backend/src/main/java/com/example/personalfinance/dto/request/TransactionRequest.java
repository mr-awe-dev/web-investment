package com.example.personalfinance.dto.request;

import com.example.personalfinance.domain.asset.QuantityUnit;
import com.example.personalfinance.domain.transaction.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Universal transaction payload. Which fields are mandatory depends on {@link #type}; the backend validates them.
 * For quantity-based types grossAmount is derived as quantity × unitPrice.
 */
public record TransactionRequest(
        @NotNull LocalDate transactionDate,
        @NotNull TransactionType type,
        @NotNull Long accountId,
        Long destinationAccountId,
        Long categoryId,
        Long assetId,
        Long liabilityId,
        @Positive BigDecimal quantity,
        QuantityUnit quantityUnit,
        @Positive BigDecimal unitPrice,
        @Positive BigDecimal grossAmount,
        @PositiveOrZero BigDecimal adminFee,
        @PositiveOrZero BigDecimal brokerFee,
        @PositiveOrZero BigDecimal levy,
        @PositiveOrZero BigDecimal tax,
        @PositiveOrZero BigDecimal interestAmount,
        String currency,
        @Positive BigDecimal exchangeRate,
        String reference,
        String description,
        /** Lot ids for SPECIFIC identification sales. */
        List<Long> lotIds) {}
