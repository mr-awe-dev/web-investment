package com.example.personalfinance.controller;

import com.example.personalfinance.dto.request.AccountRequest;
import com.example.personalfinance.dto.response.AccountResponse;
import com.example.personalfinance.dto.response.ApiResponse;
import com.example.personalfinance.dto.response.ChartOfAccountResponse;
import com.example.personalfinance.security.UserPrincipal;
import com.example.personalfinance.service.AccountService;
import com.example.personalfinance.service.ChartOfAccountService;
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
public class AccountController {

    private final AccountService accounts;
    private final ChartOfAccountService coa;

    @GetMapping("/accounts")
    public ApiResponse<List<AccountResponse>> list(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(accounts.list(p.user())); }

    @PostMapping("/accounts")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AccountResponse> create(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody AccountRequest req) {
        return ApiResponse.ok(accounts.create(p.user(), req));
    }

    @GetMapping("/accounts/{id}")
    public ApiResponse<AccountResponse> get(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id) { return ApiResponse.ok(accounts.get(p.user(), id)); }

    @PutMapping("/accounts/{id}")
    public ApiResponse<AccountResponse> update(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id, @Valid @RequestBody AccountRequest req) {
        return ApiResponse.ok(accounts.update(p.user(), id, req));
    }

    @GetMapping("/chart-of-accounts")
    public ApiResponse<List<ChartOfAccountResponse>> chart(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(coa.list(p.user())); }
}
