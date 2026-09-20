package com.example.personalfinance.domain.accounting;

import com.example.personalfinance.domain.common.BaseEntity;
import com.example.personalfinance.domain.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Chart-of-accounts entry (ledger account). System accounts come from {@link ChartOfAccountsTemplate};
 * money accounts, assets and liabilities each get a dedicated sub-account so balances derive from the ledger only.
 */
@Getter
@Setter
@Entity
@Table(name = "chart_of_accounts", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "code"}))
public class ChartOfAccount extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private LedgerType type;

    @Column(length = 20)
    private String parentCode;

    /** True for cash-like accounts (bank, RDN, cash, e-wallet, deposit) – drives the cash-flow statement. */
    @Column(nullable = false)
    private boolean cash;

    /** True for template accounts that cannot be removed. */
    @Column(nullable = false)
    private boolean system;

    public static ChartOfAccount of(User user, String code, String name, LedgerType type, String parentCode, boolean cash, boolean system) {
        ChartOfAccount c = new ChartOfAccount();
        c.user = user; c.code = code; c.name = name; c.type = type; c.parentCode = parentCode; c.cash = cash; c.system = system;
        return c;
    }
}
