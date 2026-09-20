package com.example.personalfinance.service;

import com.example.personalfinance.domain.liability.Liability;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.request.LiabilityRequest;
import com.example.personalfinance.dto.response.LiabilityResponse;
import com.example.personalfinance.exception.NotFoundException;
import com.example.personalfinance.mapper.DtoMapper;
import com.example.personalfinance.repository.LiabilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/** Loans and other debts. Outstanding principal is read from the ledger, never stored. */
@Service
@RequiredArgsConstructor
@Transactional
public class LiabilityService {

    private final LiabilityRepository repo;
    private final ChartOfAccountService coa;
    private final LedgerService ledger;

    public LiabilityResponse create(User user, LiabilityRequest req) {
        Liability l = new Liability();
        l.setUser(user);
        l.setName(req.name());
        l.setCreditor(req.creditor());
        l.setLiabilityType(req.liabilityType());
        l.setCurrency(req.currency().toUpperCase());
        l.setInterestRate(req.interestRate() == null ? BigDecimal.ZERO : req.interestRate());
        l.setTenorMonths(req.tenorMonths());
        l.setInstallment(req.installment());
        l.setDueDate(req.dueDate());
        l.setLedgerAccount(coa.createSubAccount(user, req.liabilityType().parentCode(), req.name(), false));
        return DtoMapper.liability(repo.save(l), BigDecimal.ZERO);
    }

    public Liability owned(User user, Long id) {
        return repo.findByIdAndUserId(id, user.getId()).orElseThrow(() -> new NotFoundException("Liabilitas"));
    }

    @Transactional(readOnly = true)
    public List<LiabilityResponse> list(User user) {
        LedgerService.LedgerSnapshot snap = ledger.snapshot(user, LedgerService.MIN, LedgerService.MAX);
        return repo.findByUserIdOrderByName(user.getId()).stream().map(l -> DtoMapper.liability(l, snap.of(l.getLedgerAccount()))).toList();
    }
}
