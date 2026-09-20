package com.example.personalfinance.service;

import com.example.personalfinance.domain.accounting.ChartOfAccount;
import com.example.personalfinance.domain.accounting.ChartOfAccountsTemplate;
import com.example.personalfinance.domain.accounting.Journal;
import com.example.personalfinance.domain.accounting.JournalEntry;
import com.example.personalfinance.domain.common.Money;
import com.example.personalfinance.domain.transaction.Transaction;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.repository.JournalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

/**
 * The accounting engine: the ONLY place where transactions are mapped to double-entry journal entries.
 * All amounts are converted to the user's base currency with the transaction's exchange rate.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AccountingService {

    private final JournalRepository journals;
    private final ChartOfAccountService coa;

    /** Builds, validates (debit = credit) and persists the journal of a transaction. */
    public Journal post(Transaction tx) {
        User user = tx.getUser();
        BigDecimal rate = tx.getExchangeRate();
        BigDecimal gross = Money.mul(tx.getGrossAmount(), rate);
        BigDecimal fees = Money.mul(tx.totalFees(), rate);
        BigDecimal tax = Money.mul(tx.getTax(), rate);
        BigDecimal interest = Money.mul(tx.getInterestAmount(), rate);
        BigDecimal net = Money.mul(tx.getNetAmount(), rate);
        ChartOfAccount cash = tx.getAccount().getLedgerAccount();
        ChartOfAccount feeAcc = coa.byCode(user, ChartOfAccountsTemplate.INVESTMENT_FEE);
        ChartOfAccount taxAcc = coa.byCode(user, ChartOfAccountsTemplate.TAX);

        List<JournalEntry> entries = switch (tx.getType()) {
            case INCOME, INTEREST, DIVIDEND, COUPON ->
                    lines(dr(cash, net), drIf(feeAcc, fees), drIf(taxAcc, tax), cr(incomeAccount(tx), gross));
            case EXPENSE -> lines(dr(tx.getCategory(), gross), drIf(feeAcc, fees), drIf(taxAcc, tax), cr(cash, net));
            case FEE -> lines(dr(feeAcc, gross), cr(cash, gross));
            case TAX -> lines(dr(taxAcc, gross), cr(cash, gross));
            case TRANSFER -> lines(dr(tx.getDestinationAccount().getLedgerAccount(), gross), drIf(feeAcc, fees), cr(cash, gross.add(fees)));
            case BUY_INVESTMENT, ASSET_PURCHASE -> lines(dr(tx.getAsset().getLedgerAccount(), net), cr(cash, net));
            case SELL_INVESTMENT, ASSET_SALE -> {
                BigDecimal costBasis = Money.mul(tx.getCostBasis(), rate);
                BigDecimal gain = gross.subtract(costBasis);
                ChartOfAccount realized = coa.byCode(user, ChartOfAccountsTemplate.REALIZED_GAIN);
                yield lines(dr(cash, net), drIf(feeAcc, fees), drIf(taxAcc, tax), cr(tx.getAsset().getLedgerAccount(), costBasis),
                        crIf(realized, gain), drIf(realized, gain.negate()));
            }
            case LOAN -> lines(dr(cash, gross), cr(tx.getLiability().getLedgerAccount(), gross));
            case DEBT_PAYMENT -> lines(dr(tx.getLiability().getLedgerAccount(), gross),
                    drIf(coa.byCode(user, ChartOfAccountsTemplate.INTEREST_EXPENSE), interest), drIf(feeAcc, fees), cr(cash, net));
            case OPENING_BALANCE -> lines(dr(cash, gross), cr(coa.byCode(user, ChartOfAccountsTemplate.OWNER_EQUITY), gross));
        };

        Journal j = new Journal();
        j.setTransaction(tx);
        j.setJournalDate(tx.getTransactionDate());
        j.setDescription(tx.getDescription() == null ? tx.getType().name() : tx.getDescription());
        entries.forEach(e -> { e.setMemo(tx.getReference()); j.addEntry(e); });
        j.validateBalanced();
        return journals.save(j);
    }

    /** Removes the journal of a transaction (used when voiding or re-posting). */
    public void unpost(Transaction tx) {
        journals.findByTransactionId(tx.getId()).ifPresent(journals::delete);
        journals.flush();
    }

    private ChartOfAccount incomeAccount(Transaction tx) {
        return switch (tx.getType()) {
            case DIVIDEND -> coa.byCode(tx.getUser(), ChartOfAccountsTemplate.DIVIDEND_INCOME);
            case COUPON -> coa.byCode(tx.getUser(), ChartOfAccountsTemplate.COUPON_INCOME);
            case INTEREST -> coa.byCode(tx.getUser(), ChartOfAccountsTemplate.INTEREST_INCOME);
            default -> tx.getCategory();
        };
    }

    private static List<JournalEntry> lines(JournalEntry... entries) {
        return Stream.of(entries).filter(Objects::nonNull).toList();
    }

    private static JournalEntry dr(ChartOfAccount a, BigDecimal amount) { return JournalEntry.debit(a, amount, null); }
    private static JournalEntry cr(ChartOfAccount a, BigDecimal amount) { return JournalEntry.credit(a, amount, null); }
    private static JournalEntry drIf(ChartOfAccount a, BigDecimal amount) { return amount.signum() > 0 ? dr(a, amount) : null; }
    private static JournalEntry crIf(ChartOfAccount a, BigDecimal amount) { return amount.signum() > 0 ? cr(a, amount) : null; }
}
