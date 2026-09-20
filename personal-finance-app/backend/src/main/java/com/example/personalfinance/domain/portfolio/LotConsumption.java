package com.example.personalfinance.domain.portfolio;

import com.example.personalfinance.domain.common.BaseEntity;
import com.example.personalfinance.domain.transaction.Transaction;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/** Records which lot (and how much of it) a disposal consumed, making cost basis fully auditable. */
@Getter
@Setter
@Entity
@Table(name = "lot_consumptions")
public class LotConsumption extends BaseEntity {
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sell_transaction_id")
    private Transaction sellTransaction;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lot_id")
    private StockLot lot;

    @Column(nullable = false, precision = 20, scale = 6)
    private BigDecimal quantity;

    @Column(nullable = false, precision = 20, scale = 2)
    private BigDecimal costBasis;

    public static LotConsumption of(Transaction sell, StockLot lot, BigDecimal quantity, BigDecimal costBasis) {
        LotConsumption c = new LotConsumption();
        c.sellTransaction = sell; c.lot = lot; c.quantity = quantity; c.costBasis = costBasis;
        return c;
    }
}
