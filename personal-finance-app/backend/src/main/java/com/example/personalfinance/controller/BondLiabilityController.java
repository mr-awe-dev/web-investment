package com.example.personalfinance.controller;

import com.example.personalfinance.domain.transaction.TransactionType;
import com.example.personalfinance.dto.request.BondRequest;
import com.example.personalfinance.dto.request.LiabilityRequest;
import com.example.personalfinance.dto.response.*;
import com.example.personalfinance.security.UserPrincipal;
import com.example.personalfinance.service.BondService;
import com.example.personalfinance.service.LiabilityService;
import com.example.personalfinance.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Bonds & Liabilities", description = "Bond management with coupon schedules and liabilities")
public class BondLiabilityController {

    private final BondService bonds;
    private final LiabilityService liabilities;
    private final ReportService reports;

    @GetMapping("/bonds")
    @Operation(summary = "List bonds", description = "Retrieve all bonds")
    public ApiResponse<List<BondResponse>> bonds(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(bonds.list(p.user())); }

    @PostMapping("/bonds")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create bond", description = "Create a new bond with coupon schedule")
    public ApiResponse<BondResponse> createBond(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody BondRequest req) {
        return ApiResponse.ok(bonds.create(p.user(), req));
    }

    @GetMapping("/bonds/coupons")
    @Operation(summary = "List upcoming coupons", description = "Retrieve upcoming coupon payments")
    public ApiResponse<List<CouponResponse>> coupons(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(bonds.coupons(p.user())); }

    @GetMapping("/bonds/coupons/history")
    @Operation(summary = "Coupon payment history", description = "Retrieve coupon payment transaction history")
    public ApiResponse<List<TransactionResponse>> couponHistory(@AuthenticationPrincipal UserPrincipal p) {
        return ApiResponse.ok(reports.history(p.user(), TransactionType.COUPON));
    }

    @GetMapping("/liabilities")
    @Operation(summary = "List liabilities", description = "Retrieve all liabilities")
    public ApiResponse<List<LiabilityResponse>> liabilities(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(liabilities.list(p.user())); }

    @PostMapping("/liabilities")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create liability", description = "Create a new liability")
    public ApiResponse<LiabilityResponse> createLiability(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody LiabilityRequest req) {
        return ApiResponse.ok(liabilities.create(p.user(), req));
    }
}
