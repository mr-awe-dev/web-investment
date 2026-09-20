package com.example.personalfinance.service;

import com.example.personalfinance.domain.accounting.ChartOfAccount;
import com.example.personalfinance.domain.accounting.LedgerType;
import com.example.personalfinance.domain.planning.Budget;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.request.BudgetRequest;
import com.example.personalfinance.dto.response.BudgetResponse;
import com.example.personalfinance.exception.BusinessException;
import com.example.personalfinance.exception.NotFoundException;
import com.example.personalfinance.repository.BudgetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

/** Monthly expense budgets compared against actual ledger spend. */
@Service
@RequiredArgsConstructor
@Transactional
public class BudgetService {

    private static final BigDecimal NEAR_LIMIT = new BigDecimal("0.80");

    private final BudgetRepository repo;
    private final ChartOfAccountService coa;
    private final LedgerService ledger;

    /** Creates or updates the budget of a category for a month. */
    public BudgetResponse upsert(User user, BudgetRequest req) {
        ChartOfAccount category = coa.owned(user, req.categoryId());
        if (category.getType() != LedgerType.EXPENSE) throw new BusinessException("CATEGORY_NOT_EXPENSE", "Anggaran hanya untuk kategori beban");
        Budget b = repo.findByUserIdAndCategoryIdAndPeriodMonth(user.getId(), category.getId(), req.periodMonth()).orElseGet(Budget::new);
        b.setUser(user);
        b.setCategory(category);
        b.setPeriodMonth(req.periodMonth());
        b.setAmount(req.amount());
        repo.save(b);
        return list(user, req.periodMonth()).stream().filter(x -> x.id().equals(b.getId())).findFirst().orElseThrow();
    }

    public void delete(User user, Long id) {
        repo.delete(repo.findByIdAndUserId(id, user.getId()).orElseThrow(() -> new NotFoundException("Anggaran")));
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> list(User user, String periodMonth) {
        YearMonth ym = YearMonth.parse(periodMonth);
        LedgerService.LedgerSnapshot snap = ledger.snapshot(user, ym.atDay(1), ym.atEndOfMonth());
        return repo.findByUserIdAndPeriodMonthOrderByCategoryCode(user.getId(), periodMonth).stream().map(b -> {
            BigDecimal actual = snap.of(b.getCategory());
            return new BudgetResponse(b.getId(), b.getCategory().getId(), b.getCategory().getCode(), b.getCategory().getName(), b.getPeriodMonth(),
                    b.getAmount(), actual, b.getAmount().subtract(actual), status(b.getAmount(), actual));
        }).toList();
    }

    private static String status(BigDecimal budget, BigDecimal actual) {
        if (actual.compareTo(budget) > 0) return "OVER_BUDGET";
        return actual.compareTo(budget.multiply(NEAR_LIMIT)) >= 0 ? "NEAR_LIMIT" : "HEALTHY";
    }
}
