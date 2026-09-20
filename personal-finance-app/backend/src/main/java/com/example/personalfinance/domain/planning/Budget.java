package com.example.personalfinance.domain.planning;

import com.example.personalfinance.domain.accounting.ChartOfAccount;
import com.example.personalfinance.domain.common.BaseEntity;
import com.example.personalfinance.domain.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** Monthly budget for an expense category. Actual spend is derived from the ledger. */
@Getter
@Setter
@Entity
@Table(name = "budgets", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "category_id", "period_month"}))
public class Budget extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private ChartOfAccount category;

    /** Format yyyy-MM. */
    @Column(nullable = false, length = 7)
    private String periodMonth;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal amount;
}
