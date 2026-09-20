package com.example.personalfinance.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BalanceSheetResponse(LocalDate asOf, BigDecimal totalAssets, BigDecimal totalLiabilities, BigDecimal equity,
                                   List<LineItem> assets, List<LineItem> liabilities, List<LineItem> equityItems, boolean balanced) {}
