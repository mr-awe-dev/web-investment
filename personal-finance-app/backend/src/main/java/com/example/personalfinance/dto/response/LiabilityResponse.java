package com.example.personalfinance.dto.response;

import com.example.personalfinance.domain.liability.LiabilityType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LiabilityResponse(Long id, String name, String creditor, LiabilityType liabilityType, String currency,
                                BigDecimal interestRate, Integer tenorMonths, BigDecimal installment, LocalDate dueDate,
                                String ledgerCode, BigDecimal outstanding, String status) {}
