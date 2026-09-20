package com.example.personalfinance.domain.asset;

import com.example.personalfinance.domain.accounting.ChartOfAccountsTemplate;

/** Financial and non-financial asset classes with their parent ledger account. */
public enum AssetType {
    STOCK(ChartOfAccountsTemplate.STOCKS), BOND(ChartOfAccountsTemplate.BONDS), MUTUAL_FUND(ChartOfAccountsTemplate.OTHER_ASSETS),
    ETF(ChartOfAccountsTemplate.OTHER_ASSETS), GOLD(ChartOfAccountsTemplate.OTHER_ASSETS), DEPOSIT(ChartOfAccountsTemplate.DEPOSITS),
    PROPERTY(ChartOfAccountsTemplate.PROPERTY), LAND(ChartOfAccountsTemplate.PROPERTY), VEHICLE(ChartOfAccountsTemplate.OTHER_ASSETS),
    OTHER(ChartOfAccountsTemplate.OTHER_ASSETS);

    private final String parentCode;

    AssetType(String parentCode) { this.parentCode = parentCode; }

    public String parentCode() { return parentCode; }
}
