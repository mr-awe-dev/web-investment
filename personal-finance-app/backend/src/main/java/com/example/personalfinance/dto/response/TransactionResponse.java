package com.example.personalfinance.dto.response;

import com.example.personalfinance.domain.asset.QuantityUnit;
import com.example.personalfinance.domain.cashflow.CashFlowCategory;
import com.example.personalfinance.domain.transaction.TransactionStatus;
import com.example.personalfinance.domain.transaction.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionResponse(Long id, LocalDate transactionDate, TransactionType type, CashFlowCategory cashFlowCategory,
                                  Long accountId, String accountName, Long destinationAccountId, String destinationAccountName,
                                  Long categoryId, String categoryName, Long assetId, String assetCode, Long liabilityId, String liabilityName,
                                  BigDecimal quantity, QuantityUnit quantityUnit, BigDecimal unitPrice, BigDecimal grossAmount,
                                  BigDecimal adminFee, BigDecimal brokerFee, BigDecimal levy, BigDecimal tax, BigDecimal interestAmount,
                                  BigDecimal netAmount, BigDecimal costBasis, BigDecimal realizedPl, String currency, BigDecimal exchangeRate,
                                  String baseCurrency, BigDecimal baseAmount, String reference, String description, TransactionStatus status) {}
