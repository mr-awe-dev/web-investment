package com.example.personalfinance.dto.request;

import com.example.personalfinance.domain.portfolio.CostBasisMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SettingsRequest(@NotBlank @Size(min = 3, max = 3) String baseCurrency, @NotNull CostBasisMethod costBasisMethod, @NotBlank String fullName) {}
