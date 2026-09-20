package com.example.personalfinance.controller;

import com.example.personalfinance.domain.transaction.TransactionType;
import com.example.personalfinance.dto.request.BondRequest;
import com.example.personalfinance.dto.request.LiabilityRequest;
import com.example.personalfinance.dto.response.*;
import com.example.personalfinance.security.UserPrincipal;
import com.example.personalfinance.service.BondService;
import com.example.personalfinance.service.LiabilityService;
import com.example.personalfinance.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Bonds (with coupon schedules) and liabilities. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BondLiabilityController {

    private final BondService bonds;
    private final LiabilityService liabilities;
    private final ReportService reports;

    @GetMapping("/bonds")
    public ApiResponse<List<BondResponse>> bonds(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(bonds.list(p.user())); }

    @PostMapping("/bonds")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<BondResponse> createBond(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody BondRequest req) {
        return ApiResponse.ok(bonds.create(p.user(), req));
    }

    @GetMapping("/bonds/coupons")
    public ApiResponse<List<CouponResponse>> coupons(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(bonds.coupons(p.user())); }

    @GetMapping("/bonds/coupons/history")
    public ApiResponse<List<TransactionResponse>> couponHistory(@AuthenticationPrincipal UserPrincipal p) {
        return ApiResponse.ok(reports.history(p.user(), TransactionType.COUPON));
    }

    @GetMapping("/liabilities")
    public ApiResponse<List<LiabilityResponse>> liabilities(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(liabilities.list(p.user())); }

    @PostMapping("/liabilities")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<LiabilityResponse> createLiability(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody LiabilityRequest req) {
        return ApiResponse.ok(liabilities.create(p.user(), req));
    }
}
