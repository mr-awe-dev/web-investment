package com.example.personalfinance.controller;

import com.example.personalfinance.dto.response.*;
import com.example.personalfinance.security.UserPrincipal;
import com.example.personalfinance.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
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

    @GetMapping(value = "/reports/export/pdf", produces = "application/pdf")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<byte[]> exportPdf(@AuthenticationPrincipal UserPrincipal p,
                                           @RequestParam String report,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        byte[] data = reports.exportPdf(p.user(), report, from == null ? LocalDate.now().withDayOfYear(1) : from, to == null ? LocalDate.now() : to);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header("Content-Disposition", "attachment; filename=\"laporan-" + report + ".pdf\"")
                .body(data);
    }

    @GetMapping(value = "/reports/export/xls", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    @ResponseStatus(HttpStatus.OK)
    public ResponseEntity<byte[]> exportXls(@AuthenticationPrincipal UserPrincipal p,
                                           @RequestParam String report,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        byte[] data = reports.exportXls(p.user(), report, from == null ? LocalDate.now().withDayOfYear(1) : from, to == null ? LocalDate.now() : to);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header("Content-Disposition", "attachment; filename=\"laporan-" + report + ".xlsx\"")
                .body(data);
    }

    @GetMapping("/reports/portfolio-performance")
    public ApiResponse<PortfolioResponse> portfolioPerformance(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(portfolio.portfolio(p.user())); }

    private static LocalDate defaultFrom(LocalDate from) { return from == null ? LocalDate.now().withDayOfYear(1) : from; }
    private static LocalDate defaultTo(LocalDate to) { return to == null ? LocalDate.now() : to; }
}
