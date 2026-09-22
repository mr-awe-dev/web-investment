package com.example.personalfinance.controller;

import com.example.personalfinance.dto.request.BudgetRequest;
import com.example.personalfinance.dto.request.ReconciliationRequest;
import com.example.personalfinance.dto.response.ApiResponse;
import com.example.personalfinance.dto.response.BudgetResponse;
import com.example.personalfinance.dto.response.ReconciliationResponse;
import com.example.personalfinance.security.UserPrincipal;
import com.example.personalfinance.service.BudgetService;
import com.example.personalfinance.service.ReconciliationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Planning (budgets) and reconciliation. */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Planning", description = "Budget planning and account reconciliation")
public class PlanningController {

    private final BudgetService budgets;
    private final ReconciliationService reconciliations;

    @GetMapping("/budgets")
    @Operation(summary = "List budgets", description = "Retrieve budgets for a specific period")
    public ApiResponse<List<BudgetResponse>> budgets(@AuthenticationPrincipal UserPrincipal p, @RequestParam String period) {
        return ApiResponse.ok(budgets.list(p.user(), period));
    }

    @PostMapping("/budgets")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create or update budget", description = "Create a new budget or update an existing one")
    public ApiResponse<BudgetResponse> upsert(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody BudgetRequest req) {
        return ApiResponse.ok(budgets.upsert(p.user(), req));
    }

    @DeleteMapping("/budgets/{id}")
    @Operation(summary = "Delete budget", description = "Delete a budget by ID")
    public ApiResponse<Void> deleteBudget(@AuthenticationPrincipal UserPrincipal p, @PathVariable Long id) {
        budgets.delete(p.user(), id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/reconciliations")
    @Operation(summary = "List reconciliations", description = "Retrieve account reconciliation history")
    public ApiResponse<List<ReconciliationResponse>> reconciliations(@AuthenticationPrincipal UserPrincipal p) {
        return ApiResponse.ok(reconciliations.list(p.user()));
    }

    @PostMapping("/reconciliations")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create reconciliation", description = "Create a new account reconciliation")
    public ApiResponse<ReconciliationResponse> reconcile(@AuthenticationPrincipal UserPrincipal p, @Valid @RequestBody ReconciliationRequest req) {
        return ApiResponse.ok(reconciliations.create(p.user(), req));
    }
}
