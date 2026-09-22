package com.example.personalfinance.controller;

import com.example.personalfinance.dto.request.AccountRequest;
import com.example.personalfinance.dto.response.AccountResponse;
import com.example.personalfinance.dto.response.ApiResponse;
import com.example.personalfinance.dto.response.ChartOfAccountResponse;
import com.example.personalfinance.security.UserPrincipal;
import com.example.personalfinance.service.AccountService;
import com.example.personalfinance.service.ChartOfAccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Money accounts and the chart of accounts. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Accounts", description = "Money accounts and chart of accounts management")
public class AccountController {

    private final AccountService accounts;
    private final ChartOfAccountService coa;

    @GetMapping("/accounts")
    @Operation(summary = "List accounts", description = "Retrieve all user accounts")
    public ApiResponse<List<AccountResponse>> list(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(accounts.list(p.user())); }

    @PostMapping("/accounts")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create account", description = "Create a new money account")
    public ApiResponse<AccountResponse> create(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody AccountRequest req) {
        return ApiResponse.ok(accounts.create(p.user(), req));
    }

    @GetMapping("/accounts/{id}")
    @Operation(summary = "Get account by ID", description = "Retrieve a specific account by ID")
    public ApiResponse<AccountResponse> get(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id) { return ApiResponse.ok(accounts.get(p.user(), id)); }

    @PutMapping("/accounts/{id}")
    @Operation(summary = "Update account", description = "Update an existing account")
    public ApiResponse<AccountResponse> update(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id, @Valid @RequestBody AccountRequest req) {
        return ApiResponse.ok(accounts.update(p.user(), id, req));
    }

    @GetMapping("/chart-of-accounts")
    @Operation(summary = "Get chart of accounts", description = "Retrieve the chart of accounts for the user")
    public ApiResponse<List<ChartOfAccountResponse>> chart(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(coa.list(p.user())); }
}
