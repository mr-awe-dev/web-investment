package com.example.personalfinance.dto.response;

import com.example.personalfinance.domain.account.AccountCategory;

import java.math.BigDecimal;

public record AccountResponse(Long id, String name, AccountCategory category, String currency, String institution,
                              String ledgerCode, BigDecimal balance, boolean active) {}
