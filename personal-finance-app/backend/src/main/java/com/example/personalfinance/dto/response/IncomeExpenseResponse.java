package com.example.personalfinance.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record IncomeExpenseResponse(LocalDate from, LocalDate to, BigDecimal totalIncome, BigDecimal totalExpense, BigDecimal netResult,
                                    List<LineItem> income, List<LineItem> expenses) {}
