package com.example.personalfinance.service;

import com.example.personalfinance.domain.accounting.ChartOfAccount;
import com.example.personalfinance.domain.accounting.ChartOfAccountsTemplate;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.response.ChartOfAccountResponse;
import com.example.personalfinance.exception.NotFoundException;
import com.example.personalfinance.repository.ChartOfAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Manages the per-user chart of accounts, including dedicated sub-accounts for money accounts, assets and liabilities. */
@Service
@RequiredArgsConstructor
@Transactional
public class ChartOfAccountService {

    private final ChartOfAccountRepository repo;
    private final LedgerService ledger;

    /** Seeds the default template for a freshly registered user. */
    public void seedTemplate(User user) {
        repo.saveAll(ChartOfAccountsTemplate.ROWS.stream()
                .map(r -> ChartOfAccount.of(user, r.code(), r.name(), r.type(), r.parentCode(), r.cash(), true)).toList());
    }

    /** Creates a child account (e.g. 1200.01) under a template parent. */
    public ChartOfAccount createSubAccount(User user, String parentCode, String name, boolean cash) {
        ChartOfAccount parent = byCode(user, parentCode);
        String code = parentCode + "." + String.format("%02d", repo.countByUserIdAndParentCode(user.getId(), parentCode) + 1);
        return repo.save(ChartOfAccount.of(user, code, name, parent.getType(), parentCode, cash, false));
    }

    public ChartOfAccount byCode(User user, String code) {
        return repo.findByUserIdAndCode(user.getId(), code).orElseThrow(() -> new NotFoundException("Akun buku besar " + code));
    }

    public ChartOfAccount owned(User user, Long id) {
        return repo.findByIdAndUserId(id, user.getId()).orElseThrow(() -> new NotFoundException("Kategori"));
    }

    @Transactional(readOnly = true)
    public List<ChartOfAccountResponse> list(User user) {
        LedgerService.LedgerSnapshot snap = ledger.snapshot(user, LedgerService.MIN, LedgerService.MAX);
        return snap.accounts().stream().map(a -> new ChartOfAccountResponse(a.getId(), a.getCode(), a.getName(), a.getType(),
                a.getParentCode(), a.isCash(), a.isSystem(), snap.of(a))).toList();
    }
}
