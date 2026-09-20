package com.example.personalfinance.dto.response;

import com.example.personalfinance.domain.bond.Bond;
import com.example.personalfinance.domain.bond.CouponFrequency;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record BondResponse(Long id, Long assetId, String assetCode, String assetName, String issuer, String bondType, BigDecimal nominalValue,
                           BigDecimal couponRate, BigDecimal taxRate, CouponFrequency frequency, LocalDate settlementDate, LocalDate maturityDate,
                           List<Bond.CouponItem> schedule) {}
