package com.example.personalfinance.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Investment return decomposition: realized + unrealized + income − fees − taxes. */
public record InvestmentIncomeResponse(LocalDate from, LocalDate to, BigDecimal dividendIncome, BigDecimal couponIncome, BigDecimal interestIncome,
                                       BigDecimal realizedPl, BigDecimal unrealizedPl, BigDecimal fees, BigDecimal taxes, BigDecimal totalReturn) {}
