package com.example.personalfinance.domain.liability;

import com.example.personalfinance.domain.accounting.ChartOfAccountsTemplate;

/** Debt classes with their parent ledger account. */
public enum LiabilityType {
    LOAN(ChartOfAccountsTemplate.LOANS), CREDIT_CARD(ChartOfAccountsTemplate.CREDIT_CARDS), OTHER(ChartOfAccountsTemplate.OTHER_DEBT);

    private final String parentCode;

    LiabilityType(String parentCode) { this.parentCode = parentCode; }

    public String parentCode() { return parentCode; }
}
