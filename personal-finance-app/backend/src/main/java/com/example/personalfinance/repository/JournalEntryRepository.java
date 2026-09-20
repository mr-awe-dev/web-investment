package com.example.personalfinance.repository;

import com.example.personalfinance.domain.accounting.JournalEntry;
import com.example.personalfinance.repository.projection.CashFlowRow;
import com.example.personalfinance.repository.projection.LedgerBalance;
import com.example.personalfinance.repository.projection.MonthlyDelta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

/** Aggregation queries over the ledger – the single source of truth for every report. */
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    @Query("select e from JournalEntry e join fetch e.ledgerAccount where e.journal.id = :journalId order by e.debit desc, e.id")
    List<JournalEntry> findByJournalId(Long journalId);

    /** Debit/credit totals per ledger account within a date range. */
    @Query("select new com.example.personalfinance.repository.projection.LedgerBalance(e.ledgerAccount.id, sum(e.debit), sum(e.credit)) " +
            "from JournalEntry e join e.journal j where e.ledgerAccount.user.id = :userId " +
            "and j.journalDate between :from and :to group by e.ledgerAccount.id")
    List<LedgerBalance> balances(Long userId, LocalDate from, LocalDate to);

    /** Net (debit - credit) movement per month and ledger type, used to rebuild net-worth history. */
    @Query("select new com.example.personalfinance.repository.projection.MonthlyDelta(" +
            "extract(year from j.journalDate), extract(month from j.journalDate), c.type, sum(e.debit - e.credit)) " +
            "from JournalEntry e join e.journal j join e.ledgerAccount c where c.user.id = :userId " +
            "group by extract(year from j.journalDate), extract(month from j.journalDate), c.type")
    List<MonthlyDelta> monthlyDeltas(Long userId);

    /** Net cash movement per transaction type (cash-flow statement input). */
    @Query("select new com.example.personalfinance.repository.projection.CashFlowRow(t.type, sum(e.debit - e.credit)) " +
            "from JournalEntry e join e.journal j join j.transaction t join e.ledgerAccount c " +
            "where c.cash = true and t.user.id = :userId and j.journalDate between :from and :to group by t.type")
    List<CashFlowRow> cashFlows(Long userId, LocalDate from, LocalDate to);
}
