package com.example.personalfinance.repository.projection;

import com.example.personalfinance.domain.transaction.TransactionType;

import java.math.BigDecimal;

/** Net cash movement (debit - credit on cash accounts) of one transaction type. */
public record CashFlowRow(TransactionType type, BigDecimal amount) {}
