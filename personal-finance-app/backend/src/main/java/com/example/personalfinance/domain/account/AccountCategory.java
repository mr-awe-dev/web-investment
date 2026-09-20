package com.example.personalfinance.domain.account;

import com.example.personalfinance.domain.accounting.ChartOfAccountsTemplate;

/** Kind of money account; determines the parent ledger account of its sub-ledger. */
public enum AccountCategory {
    BANK(ChartOfAccountsTemplate.BANK), RDN(ChartOfAccountsTemplate.RDN), CASH(ChartOfAccountsTemplate.CASH),
    EWALLET(ChartOfAccountsTemplate.CASH), DEPOSIT(ChartOfAccountsTemplate.DEPOSITS);

    private final String parentCode;

    AccountCategory(String parentCode) { this.parentCode = parentCode; }

    public String parentCode() { return parentCode; }
}
