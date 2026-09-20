package com.example.personalfinance.dto.response;

import com.example.personalfinance.domain.asset.AssetType;
import com.example.personalfinance.domain.asset.QuantityUnit;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Asset master data merged with its derived position (quantity, cost, market value, P/L). */
public record AssetResponse(Long id, String code, String name, AssetType assetType, String currency, QuantityUnit quantityUnit,
                            String sector, BigDecimal currentPrice, LocalDate valuationDate, String ledgerCode,
                            BigDecimal quantity, BigDecimal averageCost, BigDecimal totalCost, BigDecimal marketValue,
                            BigDecimal unrealizedPl, BigDecimal unrealizedPlPercent, BigDecimal realizedPl, BigDecimal allocationPercent) {}
