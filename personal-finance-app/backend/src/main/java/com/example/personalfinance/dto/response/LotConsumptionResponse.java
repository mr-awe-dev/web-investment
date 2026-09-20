package com.example.personalfinance.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LotConsumptionResponse(Long lotId, LocalDate lotPurchaseDate, BigDecimal quantity, BigDecimal costBasis) {}
