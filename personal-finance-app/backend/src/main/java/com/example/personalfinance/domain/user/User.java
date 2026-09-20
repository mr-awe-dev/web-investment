package com.example.personalfinance.domain.user;

import com.example.personalfinance.domain.common.BaseEntity;
import com.example.personalfinance.domain.portfolio.CostBasisMethod;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Application user. Owns every financial record (user-level data isolation). */
@Getter
@Setter
@Entity
@Table(name = "users")
public class User extends BaseEntity {
    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false, length = 120)
    private String fullName;

    /** Consolidation currency for dashboard and reports. */
    @Column(nullable = false, length = 3)
    private String baseCurrency = "IDR";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CostBasisMethod costBasisMethod = CostBasisMethod.FIFO;
}
