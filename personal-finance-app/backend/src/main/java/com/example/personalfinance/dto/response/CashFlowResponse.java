package com.example.personalfinance.dto.response;

import com.example.personalfinance.domain.cashflow.CashFlowCategory;
import com.example.personalfinance.domain.transaction.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CashFlowResponse(LocalDate from, LocalDate to, BigDecimal operating, BigDecimal investing, BigDecimal financing,
                               BigDecimal netCashFlow, List<Line> lines) {
    public record Line(CashFlowCategory category, TransactionType type, BigDecimal amount) {}
}
