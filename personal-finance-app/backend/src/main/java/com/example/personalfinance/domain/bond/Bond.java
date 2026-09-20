package com.example.personalfinance.domain.bond;

import com.example.personalfinance.domain.asset.Asset;
import com.example.personalfinance.domain.common.BaseEntity;
import com.example.personalfinance.domain.common.Money;
import com.example.personalfinance.domain.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Bond terms attached to a BOND asset. The coupon schedule is derived, never stored. */
@Getter
@Setter
@Entity
@Table(name = "bonds")
public class Bond extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asset_id", unique = true)
    private Asset asset;

    @Column(length = 160)
    private String issuer;

    @Column(length = 40)
    private String bondType;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal nominalValue;

    /** Annual coupon rate in percent. */
    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal couponRate;

    /** Withholding tax on coupons in percent. */
    @Column(nullable = false, precision = 8, scale = 4)
    private BigDecimal taxRate = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private CouponFrequency frequency;

    @Column(nullable = false)
    private LocalDate settlementDate;

    @Column(nullable = false)
    private LocalDate maturityDate;

    /** One scheduled coupon. */
    public record CouponItem(LocalDate paymentDate, BigDecimal gross, BigDecimal tax, BigDecimal net, String status) {}

    /** Generates the coupon schedule from settlement (exclusive) to maturity (inclusive); status relative to {@code today}. */
    public List<CouponItem> schedule(LocalDate today) {
        BigDecimal hundred = BigDecimal.valueOf(100);
        BigDecimal gross = nominalValue.multiply(couponRate).divide(hundred.multiply(BigDecimal.valueOf(frequency.perYear())), 2, RoundingMode.HALF_UP);
        BigDecimal tax = Money.of(gross.multiply(taxRate).divide(hundred, 2, RoundingMode.HALF_UP));
        List<CouponItem> items = new ArrayList<>();
        for (LocalDate d = settlementDate.plusMonths(frequency.months()); !d.isAfter(maturityDate); d = d.plusMonths(frequency.months())) {
            items.add(new CouponItem(d, gross, tax, gross.subtract(tax), d.isAfter(today) ? "UPCOMING" : "PAID"));
        }
        return items;
    }
}
