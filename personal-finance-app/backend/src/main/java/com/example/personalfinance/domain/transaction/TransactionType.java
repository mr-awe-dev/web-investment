package com.example.personalfinance.domain.transaction;

import com.example.personalfinance.domain.cashflow.CashFlowCategory;

import java.math.BigDecimal;

/**
 * Every supported transaction type with its cash-flow classification and net-amount rule.
 * The same enum is used by the API, the accounting mapping and the reports so classification is defined once.
 */
public enum TransactionType {
    INCOME(CashFlowCategory.OPERATING), EXPENSE(CashFlowCategory.OPERATING), TRANSFER(CashFlowCategory.NONE),
    BUY_INVESTMENT(CashFlowCategory.INVESTING), SELL_INVESTMENT(CashFlowCategory.INVESTING),
    DIVIDEND(CashFlowCategory.INVESTING), COUPON(CashFlowCategory.INVESTING), INTEREST(CashFlowCategory.OPERATING),
    LOAN(CashFlowCategory.FINANCING), DEBT_PAYMENT(CashFlowCategory.FINANCING),
    ASSET_PURCHASE(CashFlowCategory.INVESTING), ASSET_SALE(CashFlowCategory.INVESTING),
    FEE(CashFlowCategory.OPERATING), TAX(CashFlowCategory.OPERATING), OPENING_BALANCE(CashFlowCategory.FINANCING);

    private final CashFlowCategory cashFlowCategory;

    TransactionType(CashFlowCategory c) { this.cashFlowCategory = c; }

    public CashFlowCategory cashFlowCategory() { return cashFlowCategory; }

    /** Buy-side types create lots; sell-side types consume lots. */
    public boolean isAcquisition() { return this == BUY_INVESTMENT || this == ASSET_PURCHASE; }
    public boolean isDisposal() { return this == SELL_INVESTMENT || this == ASSET_SALE; }
    public boolean requiresAsset() { return isAcquisition() || isDisposal() || this == DIVIDEND || this == COUPON; }
    public boolean requiresLiability() { return this == LOAN || this == DEBT_PAYMENT; }
    public boolean requiresCategory() { return this == INCOME || this == EXPENSE; }

    /**
     * Net cash effect (absolute) given gross, fees, tax and interest. Outflows (buy, expense, debt payment)
     * add costs on top; inflows (sell, income, dividend) subtract them.
     */
    public BigDecimal netAmount(BigDecimal gross, BigDecimal fees, BigDecimal tax, BigDecimal interest) {
        return switch (this) {
            case BUY_INVESTMENT, ASSET_PURCHASE, EXPENSE -> gross.add(fees).add(tax);
            case DEBT_PAYMENT -> gross.add(interest).add(fees);
            case SELL_INVESTMENT, ASSET_SALE, INCOME, DIVIDEND, COUPON, INTEREST -> gross.subtract(fees).subtract(tax);
            case TRANSFER, LOAN, FEE, TAX, OPENING_BALANCE -> gross;
        };
    }
}
