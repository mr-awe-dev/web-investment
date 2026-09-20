package com.example.personalfinance.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record PortfolioResponse(BigDecimal totalCost, BigDecimal marketValue, BigDecimal unrealizedPl, BigDecimal unrealizedPlPercent,
                                BigDecimal realizedPl, List<AssetResponse> positions) {}
