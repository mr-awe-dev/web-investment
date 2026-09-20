package com.example.personalfinance.dto.response;

import com.example.personalfinance.domain.reconciliation.ReconciliationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ReconciliationResponse(Long id, Long accountId, String accountName, LocalDate reconciliationDate, BigDecimal systemBalance,
                                     BigDecimal actualBalance, BigDecimal difference, ReconciliationStatus status, String notes) {}
