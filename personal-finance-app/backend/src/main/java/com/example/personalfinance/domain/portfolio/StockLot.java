package com.example.personalfinance.domain.portfolio;

import com.example.personalfinance.domain.asset.Asset;
import com.example.personalfinance.domain.common.BaseEntity;
import com.example.personalfinance.domain.transaction.Transaction;
import com.example.personalfinance.domain.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/** A purchase lot. Remaining quantity/cost shrink as disposals consume it (FIFO / average / specific). */
@Getter
@Setter
@Entity
@Table(name = "stock_lots")
public class StockLot extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "asset_id")
    private Asset asset;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "transaction_id", unique = true)
    private Transaction transaction;

    @Column(nullable = false)
    private LocalDate purchaseDate;

    @Column(nullable = false, precision = 20, scale = 6)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 20, scale = 6)
    private BigDecimal remainingQuantity;

    /** Total acquisition cost including capitalised fees, original currency. */
    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal totalCost;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal remainingCost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private LotStatus status = LotStatus.OPEN;

    /** Cost per unit of the original purchase. */
    public BigDecimal unitCost() {
        return totalCost.divide(quantity, 6, java.math.RoundingMode.HALF_UP);
    }

    /** Reduces remaining quantity/cost and refreshes status. */
    public void consume(BigDecimal qty, BigDecimal cost) {
        remainingQuantity = remainingQuantity.subtract(qty);
        remainingCost = remainingCost.subtract(cost);
        refreshStatus();
    }

    /** Reverses a consumption (used when a sale is voided). */
    public void restore(BigDecimal qty, BigDecimal cost) {
        remainingQuantity = remainingQuantity.add(qty);
        remainingCost = remainingCost.add(cost);
        refreshStatus();
    }

    private void refreshStatus() {
        if (remainingQuantity.signum() == 0) status = LotStatus.CLOSED;
        else if (remainingQuantity.compareTo(quantity) < 0) status = LotStatus.PARTIAL;
        else status = LotStatus.OPEN;
    }
}
