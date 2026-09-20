package com.example.personalfinance.domain.transaction;

import com.example.personalfinance.domain.account.Account;
import com.example.personalfinance.domain.accounting.ChartOfAccount;
import com.example.personalfinance.domain.asset.Asset;
import com.example.personalfinance.domain.asset.QuantityUnit;
import com.example.personalfinance.domain.common.BaseEntity;
import com.example.personalfinance.domain.common.Money;
import com.example.personalfinance.domain.liability.Liability;
import com.example.personalfinance.domain.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Central financial event. Stores the original-currency amounts (gross, fees, tax, net) plus the exchange rate and
 * base-currency amount; the accounting engine derives balanced journal entries from it.
 */
@Getter
@Setter
@Entity
@Table(name = "transactions")
public class Transaction extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private LocalDate transactionDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false, length = 20)
    private TransactionType type;

    /** Source (or receiving) money account. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id")
    private Account account;

    /** Destination account for transfers. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_account_id")
    private Account destinationAccount;

    /** Income/expense ledger category. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private ChartOfAccount category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asset_id")
    private Asset asset;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "liability_id")
    private Liability liability;

    @Column(precision = 20, scale = 6)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private QuantityUnit quantityUnit;

    @Column(precision = 20, scale = 6)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal grossAmount;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal adminFee = Money.ZERO;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal brokerFee = Money.ZERO;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal levy = Money.ZERO;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal tax = Money.ZERO;

    /** Interest portion of a debt payment. */
    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal interestAmount = Money.ZERO;

    /** Total cost (outflows) or net proceeds (inflows) in original currency. */
    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal netAmount;

    /** Cost basis consumed by a disposal (original currency). */
    @Column(precision = 20, scale = 2)
    private BigDecimal costBasis;

    /** Gross proceeds - cost basis for a disposal (original currency). */
    @Column(precision = 20, scale = 2)
    private BigDecimal realizedPl;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, precision = 20, scale = 6)
    private BigDecimal exchangeRate = BigDecimal.ONE;

    @Column(nullable = false, length = 3)
    private String baseCurrency;

    /** netAmount × exchangeRate, in base currency. */
    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal baseAmount;

    @Column(length = 80)
    private String reference;

    @Column(length = 500)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TransactionStatus status = TransactionStatus.POSTED;

    public BigDecimal totalFees() {
        return adminFee.add(brokerFee).add(levy);
    }
}
