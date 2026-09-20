package com.example.personalfinance.dto.request;

import com.example.personalfinance.domain.account.AccountCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AccountRequest(@NotBlank String name, @NotNull AccountCategory category, @NotBlank @Size(min = 3, max = 3) String currency, String institution) {}
