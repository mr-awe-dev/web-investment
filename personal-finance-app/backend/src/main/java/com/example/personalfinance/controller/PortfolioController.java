package com.example.personalfinance.controller;

import com.example.personalfinance.domain.transaction.TransactionType;
import com.example.personalfinance.dto.request.AssetRequest;
import com.example.personalfinance.dto.request.PriceUpdateRequest;
import com.example.personalfinance.dto.request.TransactionRequest;
import com.example.personalfinance.dto.response.*;
import com.example.personalfinance.exception.BusinessException;
import com.example.personalfinance.security.UserPrincipal;
import com.example.personalfinance.service.AssetService;
import com.example.personalfinance.service.PortfolioService;
import com.example.personalfinance.service.ReportService;
import com.example.personalfinance.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Assets, portfolio positions/lots, stock buy/sell shortcuts and dividend history. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PortfolioController {

    private final AssetService assets;
    private final PortfolioService portfolio;
    private final TransactionService transactions;
    private final ReportService reports;

    @GetMapping("/assets")
    public ApiResponse<List<AssetResponse>> assets(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(assets.list(p.user())); }

    @PostMapping("/assets")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AssetResponse> createAsset(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody AssetRequest req) {
        return ApiResponse.ok(assets.create(p.user(), req));
    }

    @GetMapping("/assets/{id}")
    public ApiResponse<AssetResponse> asset(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id) { return ApiResponse.ok(assets.get(p.user(), id)); }

    @PutMapping("/assets/{id}/price")
    public ApiResponse<AssetResponse> price(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id, @Valid @RequestBody PriceUpdateRequest req) {
        return ApiResponse.ok(assets.updatePrice(p.user(), id, req));
    }

    @GetMapping("/portfolio")
    public ApiResponse<PortfolioResponse> portfolio(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(portfolio.portfolio(p.user())); }

    @GetMapping("/portfolio/positions")
    public ApiResponse<List<AssetResponse>> positions(@AuthenticationPrincipal UserPrincipal p) { return ApiResponse.ok(portfolio.positions(p.user(), true)); }

    @GetMapping("/portfolio/lots")
    public ApiResponse<List<StockLotResponse>> lots(@AuthenticationPrincipal UserPrincipal p, @RequestParam(required = false) Long assetId) {
        return ApiResponse.ok(portfolio.lots(p.user(), assetId));
    }

    @GetMapping("/stocks")
    public ApiResponse<List<AssetResponse>> stocks(@AuthenticationPrincipal UserPrincipal p) {
        return ApiResponse.ok(assets.list(p.user()).stream().filter(a -> a.assetType() == com.example.personalfinance.domain.asset.AssetType.STOCK).toList());
    }

    @PostMapping("/stocks/buy")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TransactionDetailResponse> buy(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody TransactionRequest req) {
        return ApiResponse.ok(transactions.create(p.user(), typed(req, TransactionType.BUY_INVESTMENT)));
    }

    @PostMapping("/stocks/sell")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TransactionDetailResponse> sell(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody TransactionRequest req) {
        return ApiResponse.ok(transactions.create(p.user(), typed(req, TransactionType.SELL_INVESTMENT)));
    }

    @GetMapping("/dividends")
    public ApiResponse<List<TransactionResponse>> dividends(@AuthenticationPrincipal UserPrincipal p) {
        return ApiResponse.ok(reports.history(p.user(), TransactionType.DIVIDEND));
    }

    @PostMapping("/dividends")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TransactionDetailResponse> dividend(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody TransactionRequest req) {
        return ApiResponse.ok(transactions.create(p.user(), typed(req, TransactionType.DIVIDEND)));
    }

    /** Shortcut endpoints must carry the type they stand for. */
    private static TransactionRequest typed(TransactionRequest r, TransactionType expected) {
        if (r.type() != expected) throw new BusinessException("TYPE_MISMATCH", "Tipe transaksi harus " + expected);
        return r;
    }
}
