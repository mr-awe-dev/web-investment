package com.example.personalfinance.dto.response;

import com.example.personalfinance.domain.portfolio.CostBasisMethod;

public record UserResponse(Long id, String email, String fullName, String baseCurrency, CostBasisMethod costBasisMethod) {}
