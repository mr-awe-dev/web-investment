package com.example.personalfinance.domain.reconciliation;

import com.example.personalfinance.domain.account.Account;
import com.example.personalfinance.domain.common.BaseEntity;
import com.example.personalfinance.domain.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Comparison between ledger balance and the real-world statement balance of a money account. */
@Getter
@Setter
@Entity
@Table(name = "reconciliations")
public class Reconciliation extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "account_id")
    private Account account;

    @Column(nullable = false)
    private LocalDate reconciliationDate;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal systemBalance;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal actualBalance;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal difference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReconciliationStatus status;

    @Column(length = 500)
    private String notes;
}
