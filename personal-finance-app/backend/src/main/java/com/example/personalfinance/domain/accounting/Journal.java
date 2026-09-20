package com.example.personalfinance.domain.accounting;

import com.example.personalfinance.domain.common.BaseEntity;
import com.example.personalfinance.domain.transaction.Transaction;
import com.example.personalfinance.exception.UnbalancedJournalException;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Double-entry journal header. Exactly one journal per posted transaction; entries are in the user's base currency. */
@Getter
@Setter
@Entity
@Table(name = "journals")
public class Journal extends BaseEntity {
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "transaction_id", unique = true)
    private Transaction transaction;

    @Column(nullable = false)
    private LocalDate journalDate;

    @Column(length = 255)
    private String description;

    @Column(nullable = false, length = 20)
    private String status = "POSTED";

    @OneToMany(mappedBy = "journal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<JournalEntry> entries = new ArrayList<>();

    public void addEntry(JournalEntry e) {
        e.setJournal(this);
        entries.add(e);
    }

    /** Enforces the invariant TOTAL DEBIT = TOTAL CREDIT. */
    public void validateBalanced() {
        BigDecimal debit = entries.stream().map(JournalEntry::getDebit).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal credit = entries.stream().map(JournalEntry::getCredit).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (debit.compareTo(credit) != 0) throw new UnbalancedJournalException();
    }
}
