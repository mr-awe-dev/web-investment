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
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
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
    @Operation(summary = "List bonds", description = "Retrieve all bonds",
responses = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Success", useReturnTypeSchema = true),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Missing, invalid or expired bearer token",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
        })
    public ApiResponse<List<BondResponse>> bonds(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(bonds.list(p.user())); }

    @PostMapping("/bonds")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create bond", description = "Create a new bond with coupon schedule",
responses = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", useReturnTypeSchema = true, description = "Resource created successfully",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed (VALIDATION_ERROR) or a business rule was violated",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Missing, invalid or expired bearer token",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
        })
    public ApiResponse<BondResponse> createBond(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody BondRequest req) {
        return ApiResponse.ok(bonds.create(p.user(), req));
    }

    @GetMapping("/bonds/coupons")
    @Operation(summary = "List upcoming coupons", description = "Retrieve upcoming coupon payments",
responses = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Success", useReturnTypeSchema = true),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Missing, invalid or expired bearer token",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
        })
    public ApiResponse<List<CouponResponse>> coupons(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(bonds.coupons(p.user())); }

    @GetMapping("/bonds/coupons/history")
    @Operation(summary = "Coupon payment history", description = "Retrieve coupon payment transaction history",
responses = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Success", useReturnTypeSchema = true),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Missing, invalid or expired bearer token",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
        })
    public ApiResponse<List<TransactionResponse>> couponHistory(@AuthenticationPrincipal UserPrincipal p) {
        return ApiResponse.ok(reports.history(p.user(), TransactionType.COUPON));
    }

    @GetMapping("/liabilities")
    @Operation(summary = "List liabilities", description = "Retrieve all liabilities",
responses = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Success", useReturnTypeSchema = true),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Missing, invalid or expired bearer token",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
        })
    public ApiResponse<List<LiabilityResponse>> liabilities(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(liabilities.list(p.user())); }

    @PostMapping("/liabilities")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create liability", description = "Create a new liability",
responses = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", useReturnTypeSchema = true, description = "Resource created successfully",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed (VALIDATION_ERROR) or a business rule was violated",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Missing, invalid or expired bearer token",
                    content = @Content(schema = @Schema(implementation = ApiResponse.class)))
        })
    public ApiResponse<LiabilityResponse> createLiability(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody LiabilityRequest req) {
        return ApiResponse.ok(liabilities.create(p.user(), req));
    }
}
