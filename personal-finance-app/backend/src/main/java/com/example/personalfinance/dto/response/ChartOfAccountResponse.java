package com.example.personalfinance.dto.response;

import com.example.personalfinance.domain.accounting.LedgerType;

import java.math.BigDecimal;

public record ChartOfAccountResponse(Long id, String code, String name, LedgerType type, String parentCode, boolean cash, boolean system, BigDecimal balance) {}
