package com.example.personalfinance.domain.accounting;

/** The five fundamental ledger account classes. Assets/Expenses carry debit balances, the rest credit balances. */
public enum LedgerType {
    ASSET, LIABILITY, EQUITY, INCOME, EXPENSE;

    /** True when a positive balance is a debit balance. */
    public boolean debitNormal() {
        return this == ASSET || this == EXPENSE;
    }
}
