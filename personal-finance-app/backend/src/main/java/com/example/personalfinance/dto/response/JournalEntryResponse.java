package com.example.personalfinance.dto.response;

import java.math.BigDecimal;

public record JournalEntryResponse(String ledgerCode, String ledgerName, BigDecimal debit, BigDecimal credit, String memo) {}
