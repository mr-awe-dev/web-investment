package com.example.personalfinance.dto.response;

import com.example.personalfinance.domain.portfolio.LotStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

public record StockLotResponse(Long id, Long assetId, String assetCode, Long transactionId, LocalDate purchaseDate, BigDecimal quantity,
                               BigDecimal remainingQuantity, BigDecimal unitCost, BigDecimal totalCost, BigDecimal remainingCost, LotStatus status) {}
