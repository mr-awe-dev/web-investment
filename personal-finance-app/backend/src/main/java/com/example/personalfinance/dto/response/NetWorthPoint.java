package com.example.personalfinance.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record NetWorthPoint(LocalDate date, BigDecimal totalAssets, BigDecimal totalLiabilities, BigDecimal netWorth) {}
