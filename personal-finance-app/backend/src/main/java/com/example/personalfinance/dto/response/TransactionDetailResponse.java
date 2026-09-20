package com.example.personalfinance.dto.response;

import com.example.personalfinance.domain.cashflow.CashFlowCategory;

import java.math.BigDecimal;
import java.util.List;

/** Transaction plus its full accounting, portfolio, cash-flow and P/L impact. */
public record TransactionDetailResponse(TransactionResponse transaction, List<JournalEntryResponse> journalEntries,
                                        BigDecimal portfolioQuantityImpact, CashFlowCategory cashFlowCategory, BigDecimal cashFlowImpact,
                                        BigDecimal realizedPl, List<LotConsumptionResponse> lotConsumptions) {}
