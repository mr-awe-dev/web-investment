package com.example.personalfinance.controller;

import com.example.personalfinance.domain.transaction.TransactionType;
import com.example.personalfinance.dto.request.TransactionRequest;
import com.example.personalfinance.dto.response.ApiResponse;
import com.example.personalfinance.dto.response.PageResponse;
import com.example.personalfinance.dto.response.TransactionDetailResponse;
import com.example.personalfinance.dto.response.TransactionResponse;
import com.example.personalfinance.security.UserPrincipal;
import com.example.personalfinance.service.ReportService;
import com.example.personalfinance.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/** Transactions – the single entry point for every financial change – plus CSV export. */
@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactions;
    private final ReportService reports;

    @GetMapping
    public ApiResponse<PageResponse<TransactionResponse>> list(
            @AuthenticationPrincipal UserPrincipal p,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) Long assetId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, Math.min(size, 200), Sort.by(Sort.Direction.DESC, "transactionDate", "id"));
        return ApiResponse.ok(transactions.list(p.user(), new TransactionService.Filter(from, to, type, accountId, assetId, search), pageable));
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<String> export(
            @AuthenticationPrincipal UserPrincipal p,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) Long assetId,
            @RequestParam(required = false) String search) {
        String csv = reports.exportCsv(p.user(), new TransactionService.Filter(from, to, type, accountId, assetId, search));
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("text/csv"))
                .header("Content-Disposition", "attachment; filename=transactions.csv").body(csv);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TransactionDetailResponse> create(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody TransactionRequest req) {
        return ApiResponse.ok(transactions.create(p.user(), req));
    }

    @GetMapping("/{id}")
    public ApiResponse<TransactionDetailResponse> get(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id) {
        return ApiResponse.ok(transactions.detail(p.user(), id));
    }

    @PutMapping("/{id}")
    public ApiResponse<TransactionDetailResponse> update(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id, @Valid @RequestBody TransactionRequest req) {
        return ApiResponse.ok(transactions.update(p.user(), id, req));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id) {
        transactions.delete(p.user(), id);
        return ApiResponse.ok(null);
    }
}
