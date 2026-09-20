package com.example.personalfinance.repository.projection;

import java.math.BigDecimal;

/** Generic amount keyed by asset id. */
public record AssetAmount(Long assetId, BigDecimal amount) {}
