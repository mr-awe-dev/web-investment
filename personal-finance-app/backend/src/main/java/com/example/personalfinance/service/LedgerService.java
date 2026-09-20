package com.example.personalfinance.service;

import com.example.personalfinance.domain.accounting.ChartOfAccount;
import com.example.personalfinance.domain.accounting.LedgerType;
import com.example.personalfinance.domain.common.Money;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.response.LineItem;
import com.example.personalfinance.repository.ChartOfAccountRepository;
import com.example.personalfinance.repository.JournalEntryRepository;
import com.example.personalfinance.repository.projection.LedgerBalance;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Reads balances from the double-entry ledger. Every report and every displayed balance goes through here. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LedgerService {
    public static final LocalDate MIN = LocalDate.of(1900, 1, 1);
    public static final LocalDate MAX = LocalDate.of(2999, 12, 31);

    private final JournalEntryRepository entries;
    private final ChartOfAccountRepository accounts;

    /** Ledger accounts of a user with their natural-sign balances for a period. */
    public record LedgerSnapshot(List<ChartOfAccount> accounts, Map<Long, BigDecimal> balances) {
        public BigDecimal of(ChartOfAccount c) { return balances.getOrDefault(c.getId(), Money.ZERO); }

        public BigDecimal ofCode(String code) {
            return accounts.stream().filter(a -> a.getCode().equals(code)).findFirst().map(this::of).orElse(Money.ZERO);
        }

        public BigDecimal total(LedgerType type) {
            return accounts.stream().filter(a -> a.getType() == type).map(this::of).reduce(Money.ZERO, BigDecimal::add);
        }

        public BigDecimal cash() {
            return accounts.stream().filter(ChartOfAccount::isCash).map(this::of).reduce(Money.ZERO, BigDecimal::add);
        }

        /** Non-zero leaf lines of a ledger type, ordered by code. */
        public List<LineItem> lines(LedgerType type) {
            return accounts.stream().filter(a -> a.getType() == type && of(a).signum() != 0)
                    .map(a -> new LineItem(a.getCode(), a.getName(), of(a))).toList();
        }
    }

    /** Debit-normal accounts return debit − credit, credit-normal accounts return credit − debit. */
    public LedgerSnapshot snapshot(User user, LocalDate from, LocalDate to) {
        List<ChartOfAccount> coa = accounts.findByUserIdOrderByCode(user.getId());
        Map<Long, ChartOfAccount> byId = coa.stream().collect(Collectors.toMap(ChartOfAccount::getId, Function.identity()));
        Map<Long, BigDecimal> balances = new HashMap<>();
        for (LedgerBalance b : entries.balances(user.getId(), from, to)) {
            boolean debitNormal = byId.get(b.ledgerAccountId()).getType().debitNormal();
            balances.put(b.ledgerAccountId(), debitNormal ? b.debit().subtract(b.credit()) : b.credit().subtract(b.debit()));
        }
        return new LedgerSnapshot(coa, balances);
    }

    /** Cumulative balance of one ledger account up to and including a date. */
    public BigDecimal balanceOf(User user, ChartOfAccount account, LocalDate to) {
        return snapshot(user, MIN, to).of(account);
    }
}
