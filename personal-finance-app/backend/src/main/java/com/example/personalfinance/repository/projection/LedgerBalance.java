package com.example.personalfinance.repository.projection;

import java.math.BigDecimal;

/** Raw debit/credit totals of a ledger account. */
public record LedgerBalance(Long ledgerAccountId, BigDecimal debit, BigDecimal credit) {}
