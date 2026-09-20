package com.example.personalfinance.domain.accounting;

import com.example.personalfinance.domain.common.BaseEntity;
import com.example.personalfinance.domain.common.Money;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** A single debit or credit line of a journal, always in base currency. */
@Getter
@Setter
@Entity
@Table(name = "journal_entries")
public class JournalEntry extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "journal_id")
    private Journal journal;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ledger_account_id")
    private ChartOfAccount ledgerAccount;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal debit = Money.ZERO;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal credit = Money.ZERO;

    @Column(length = 255)
    private String memo;

    public static JournalEntry debit(ChartOfAccount account, BigDecimal amount, String memo) {
        JournalEntry e = new JournalEntry();
        e.ledgerAccount = account; e.debit = Money.of(amount); e.memo = memo;
        return e;
    }

    public static JournalEntry credit(ChartOfAccount account, BigDecimal amount, String memo) {
        JournalEntry e = new JournalEntry();
        e.ledgerAccount = account; e.credit = Money.of(amount); e.memo = memo;
        return e;
    }
}
