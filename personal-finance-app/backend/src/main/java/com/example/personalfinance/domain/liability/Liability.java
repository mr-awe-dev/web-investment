package com.example.personalfinance.domain.liability;

import com.example.personalfinance.domain.accounting.ChartOfAccount;
import com.example.personalfinance.domain.common.BaseEntity;
import com.example.personalfinance.domain.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Loan / credit card / other debt. Outstanding principal is the credit balance of {@link #ledgerAccount}. */
@Getter
@Setter
@Entity
@Table(name = "liabilities")
public class Liability extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 120)
    private String creditor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LiabilityType liabilityType;

    @Column(nullable = false, length = 3)
    private String currency;

    /** Annual interest rate in percent (e.g. 12.50). */
    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal interestRate = BigDecimal.ZERO;

    private Integer tenorMonths;

    @Column(precision = 20, scale = 2)
    private BigDecimal installment;

    private LocalDate dueDate;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ledger_account_id", unique = true)
    private ChartOfAccount ledgerAccount;
}
