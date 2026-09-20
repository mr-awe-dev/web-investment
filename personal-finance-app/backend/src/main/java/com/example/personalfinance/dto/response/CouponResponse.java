package com.example.personalfinance.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CouponResponse(Long bondId, String assetCode, String assetName, LocalDate paymentDate, BigDecimal gross, BigDecimal tax, BigDecimal net, String status) {}
