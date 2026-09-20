package com.example.personalfinance.controller;

import com.example.personalfinance.dto.response.*;
import com.example.personalfinance.security.UserPrincipal;
import com.example.personalfinance.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Dashboard and financial reports. Dates default to the current year / today. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reports;
    private final BalanceSheetService balanceSheet;
    private final ProfitLossService profitLoss;
    private final CashFlowService cashFlow;
    private final NetWorthService netWorth;
    private final PortfolioService portfolio;

    @GetMapping("/dashboard")
    public ApiResponse<DashboardResponse> dashboard(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(reports.dashboard(p.user())); }

    @GetMapping("/reports/balance-sheet")
    public ApiResponse<BalanceSheetResponse> balanceSheet(@AuthenticationPrincipal UserPrincipal p,
                                                          @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOf) {
        return ApiResponse.ok(balanceSheet.asOf(p.user(), asOf == null ? LocalDate.now() : asOf));
    }

    @GetMapping("/reports/income-expense")
    public ApiResponse<IncomeExpenseResponse> incomeExpense(@AuthenticationPrincipal UserPrincipal p,
                                                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                                            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.ok(profitLoss.incomeExpense(p.user(), defaultFrom(from), defaultTo(to)));
    }

    @GetMapping("/reports/cash-flow")
    public ApiResponse<CashFlowResponse> cashFlow(@AuthenticationPrincipal UserPrincipal p,
                                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.ok(cashFlow.statement(p.user(), defaultFrom(from), defaultTo(to)));
    }

    @GetMapping("/reports/investment-income")
    public ApiResponse<InvestmentIncomeResponse> investmentIncome(@AuthenticationPrincipal UserPrincipal p,
                                                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                                                  @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.ok(profitLoss.investmentIncome(p.user(), from == null ? LedgerService.MIN : from, defaultTo(to)));
    }

    @GetMapping("/reports/net-worth")
    public ApiResponse<List<NetWorthPoint>> netWorth(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(netWorth.history(p.user())); }

    @GetMapping("/reports/net-worth/current")
    public ApiResponse<NetWorthPoint> netWorthNow(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(netWorth.current(p.user(), LocalDate.now())); }

    @GetMapping("/reports/portfolio-performance")
    public ApiResponse<PortfolioResponse> portfolioPerformance(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(portfolio.portfolio(p.user())); }

    private static LocalDate defaultFrom(LocalDate from) { return from == null ? LocalDate.now().withDayOfYear(1) : from; }
    private static LocalDate defaultTo(LocalDate to) { return to == null ? LocalDate.now() : to; }
}
