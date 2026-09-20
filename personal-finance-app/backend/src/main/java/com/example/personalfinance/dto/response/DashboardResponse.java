package com.example.personalfinance.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(BigDecimal totalAssets, BigDecimal totalInvestments, BigDecimal cashAndBank, BigDecimal totalLiabilities,
                                BigDecimal netWorth, InvestmentIncomeResponse investment, List<NetWorthPoint> netWorthHistory,
                                List<LineItem> allocation, CashFlowResponse cashFlow, List<UpcomingItem> upcoming,
                                List<TransactionResponse> recentTransactions) {
    public record UpcomingItem(String kind, String label, java.time.LocalDate date, BigDecimal amount) {}
}
