package com.example.personalfinance.domain.asset;

import com.example.personalfinance.domain.accounting.ChartOfAccount;
import com.example.personalfinance.domain.common.BaseEntity;
import com.example.personalfinance.domain.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Investment or non-financial asset (stock, bond, gold, property, ...). Holdings and cost basis derive from
 * {@link com.example.personalfinance.domain.portfolio.StockLot}s; only the market price is stored here.
 */
@Getter
@Setter
@Entity
@Table(name = "assets", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "code"}))
public class Asset extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 40)
    private String code;

    @Column(nullable = false, length = 160)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AssetType assetType;

    @Column(nullable = false, length = 3)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private QuantityUnit quantityUnit;

    @Column(length = 80)
    private String sector;

    /** Latest market price per unit, used for unrealized P/L only (never touches the ledger). */
    @Column(nullable = false, precision = 20, scale = 6)
    private BigDecimal currentPrice = BigDecimal.ZERO;

    private LocalDate valuationDate;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ledger_account_id", unique = true)
    private ChartOfAccount ledgerAccount;
}
