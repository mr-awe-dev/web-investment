package com.example.personalfinance.service;

import com.example.personalfinance.domain.account.Account;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.request.AccountRequest;
import com.example.personalfinance.dto.response.AccountResponse;
import com.example.personalfinance.exception.NotFoundException;
import com.example.personalfinance.mapper.DtoMapper;
import com.example.personalfinance.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Money accounts (bank, RDN, cash, e-wallet, deposit). Balances always come from the ledger. */
@Service
@RequiredArgsConstructor
@Transactional
public class AccountService {

    private final AccountRepository repo;
    private final ChartOfAccountService coa;
    private final LedgerService ledger;

    public AccountResponse create(User user, AccountRequest req) {
        Account a = new Account();
        a.setUser(user);
        a.setLedgerAccount(coa.createSubAccount(user, req.category().parentCode(), req.name(), true));
        applyFields(a, req);
        return DtoMapper.account(repo.save(a), ledger.balanceOf(user, a.getLedgerAccount(), LedgerService.MAX));
    }

    public AccountResponse update(User user, Long id, AccountRequest req) {
        Account a = owned(user, id);
        applyFields(a, req);
        a.getLedgerAccount().setName(req.name());
        return DtoMapper.account(a, ledger.balanceOf(user, a.getLedgerAccount(), LedgerService.MAX));
    }

    private void applyFields(Account a, AccountRequest req) {
        a.setName(req.name());
        a.setCategory(req.category());
        a.setCurrency(req.currency().toUpperCase());
        a.setInstitution(req.institution());
    }

    public Account owned(User user, Long id) {
        return repo.findByIdAndUserId(id, user.getId()).orElseThrow(() -> new NotFoundException("Akun"));
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> list(User user) {
        LedgerService.LedgerSnapshot snap = ledger.snapshot(user, LedgerService.MIN, LedgerService.MAX);
        return repo.findByUserIdOrderByName(user.getId()).stream().map(a -> DtoMapper.account(a, snap.of(a.getLedgerAccount()))).toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse get(User user, Long id) {
        Account a = owned(user, id);
        return DtoMapper.account(a, ledger.balanceOf(user, a.getLedgerAccount(), LedgerService.MAX));
    }
}
