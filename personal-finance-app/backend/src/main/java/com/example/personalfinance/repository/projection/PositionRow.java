package com.example.personalfinance.repository.projection;

import java.math.BigDecimal;

/** Open quantity and remaining cost of one asset. */
public record PositionRow(Long assetId, BigDecimal quantity, BigDecimal cost) {}
