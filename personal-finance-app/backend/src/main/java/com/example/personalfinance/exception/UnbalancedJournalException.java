package com.example.personalfinance.exception;

import org.springframework.http.HttpStatus;

/** Raised when the accounting engine produces a journal whose debits do not equal credits. */
public class UnbalancedJournalException extends ApiException {
    public UnbalancedJournalException() {
        super(HttpStatus.INTERNAL_SERVER_ERROR, "UNBALANCED_JOURNAL", "Jurnal tidak seimbang: total debit harus sama dengan total kredit");
    }
}
