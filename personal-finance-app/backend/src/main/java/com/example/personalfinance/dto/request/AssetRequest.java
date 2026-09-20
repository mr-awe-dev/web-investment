package com.example.personalfinance.dto.request;

import com.example.personalfinance.domain.asset.AssetType;
import com.example.personalfinance.domain.asset.QuantityUnit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AssetRequest(@NotBlank String code, @NotBlank String name, @NotNull AssetType assetType,
                           @NotBlank @Size(min = 3, max = 3) String currency, @NotNull QuantityUnit quantityUnit,
                           @PositiveOrZero BigDecimal currentPrice, String sector) {}
