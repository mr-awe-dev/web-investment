package com.example.personalfinance.domain.account;

import com.example.personalfinance.domain.accounting.ChartOfAccount;
import com.example.personalfinance.domain.common.BaseEntity;
import com.example.personalfinance.domain.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Money account (bank, RDN, cash, e-wallet, deposit). Its balance is the balance of {@link #ledgerAccount}. */
@Getter
@Setter
@Entity
@Table(name = "accounts")
public class Account extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountCategory category;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(length = 120)
    private String institution;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ledger_account_id", unique = true)
    private ChartOfAccount ledgerAccount;

    @Column(nullable = false)
    private boolean active = true;
}
