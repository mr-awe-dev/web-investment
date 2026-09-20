package com.example.personalfinance.repository.projection;

import com.example.personalfinance.domain.accounting.LedgerType;

import java.math.BigDecimal;

/** Net debit-minus-credit movement of one ledger type in one month. */
public record MonthlyDelta(Integer year, Integer month, LedgerType type, BigDecimal amount) {}
