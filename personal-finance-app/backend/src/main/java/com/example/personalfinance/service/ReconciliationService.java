package com.example.personalfinance.service;

import com.example.personalfinance.domain.account.Account;
import com.example.personalfinance.domain.common.Money;
import com.example.personalfinance.domain.reconciliation.Reconciliation;
import com.example.personalfinance.domain.reconciliation.ReconciliationStatus;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.request.ReconciliationRequest;
import com.example.personalfinance.dto.response.ReconciliationResponse;
import com.example.personalfinance.repository.ReconciliationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/** Compares the ledger balance of a money account with the real statement balance. */
@Service
@RequiredArgsConstructor
@Transactional
public class ReconciliationService {

    private final ReconciliationRepository repo;
    private final AccountService accounts;
    private final LedgerService ledger;

    public ReconciliationResponse create(User user, ReconciliationRequest req) {
        Account account = accounts.owned(user, req.accountId());
        BigDecimal system = ledger.balanceOf(user, account.getLedgerAccount(), req.reconciliationDate());
        BigDecimal actual = Money.of(req.actualBalance());
        BigDecimal diff = actual.subtract(system);
        Reconciliation r = new Reconciliation();
        r.setUser(user);
        r.setAccount(account);
        r.setReconciliationDate(req.reconciliationDate());
        r.setSystemBalance(system);
        r.setActualBalance(actual);
        r.setDifference(diff);
        r.setNotes(req.notes());
        r.setStatus(diff.signum() == 0 ? ReconciliationStatus.RECONCILED
                : req.notes() == null ? ReconciliationStatus.DIFFERENCE_FOUND : ReconciliationStatus.PENDING_REVIEW);
        return toResponse(repo.save(r));
    }

    @Transactional(readOnly = true)
    public List<ReconciliationResponse> list(User user) {
        return repo.findByUserIdOrderByReconciliationDateDescIdDesc(user.getId()).stream().map(ReconciliationService::toResponse).toList();
    }

    private static ReconciliationResponse toResponse(Reconciliation r) {
        return new ReconciliationResponse(r.getId(), r.getAccount().getId(), r.getAccount().getName(), r.getReconciliationDate(),
                r.getSystemBalance(), r.getActualBalance(), r.getDifference(), r.getStatus(), r.getNotes());
    }
}
