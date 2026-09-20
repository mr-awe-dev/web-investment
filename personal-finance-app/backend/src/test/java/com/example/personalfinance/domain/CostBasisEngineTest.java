package com.example.personalfinance.domain;

import com.example.personalfinance.domain.asset.Asset;
import com.example.personalfinance.domain.portfolio.CostBasisEngine;
import com.example.personalfinance.domain.portfolio.CostBasisMethod;
import com.example.personalfinance.domain.portfolio.LotStatus;
import com.example.personalfinance.domain.portfolio.StockLot;
import com.example.personalfinance.exception.BusinessException;
import com.example.personalfinance.exception.InsufficientQuantityException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CostBasisEngineTest {

    private static StockLot lot(long id, String qty, String cost) {
        StockLot l = new StockLot();
        l.setId(id);
        l.setAsset(new Asset());
        l.setPurchaseDate(LocalDate.of(2026, 1, (int) id));
        l.setQuantity(new BigDecimal(qty));
        l.setRemainingQuantity(new BigDecimal(qty));
        l.setTotalCost(new BigDecimal(cost));
        l.setRemainingCost(new BigDecimal(cost));
        return l;
    }

    @Test
    void fifoConsumesOldestLotsFirst() {
        List<CostBasisEngine.Slice> s = CostBasisEngine.plan(List.of(lot(1, "100", "1000000"), lot(2, "50", "550000")), new BigDecimal("120"), CostBasisMethod.FIFO, null);
        assertThat(s).hasSize(2);
        assertThat(s.get(0).cost()).isEqualByComparingTo("1000000");
        assertThat(s.get(1).cost()).isEqualByComparingTo("220000.00");
    }

    @Test
    void fifoStopsOnceQuantityIsSatisfied() {
        List<CostBasisEngine.Slice> s = CostBasisEngine.plan(List.of(lot(1, "100", "1000000"), lot(2, "50", "550000")), new BigDecimal("100"), CostBasisMethod.FIFO, null);
        assertThat(s).hasSize(1);
    }

    @Test
    void averageUsesBlendedUnitCost() {
        List<CostBasisEngine.Slice> s = CostBasisEngine.plan(List.of(lot(1, "100", "1000000"), lot(2, "100", "1200000")), new BigDecimal("100"), CostBasisMethod.AVERAGE, null);
        assertThat(s).hasSize(1);
        assertThat(s.get(0).cost()).isEqualByComparingTo("1100000.00");
    }

    @Test
    void specificIdentificationRules() {
        List<StockLot> lots = List.of(lot(1, "100", "1000000"), lot(2, "100", "1200000"));
        assertThatThrownBy(() -> CostBasisEngine.plan(lots, BigDecimal.TEN, CostBasisMethod.SPECIFIC, null)).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> CostBasisEngine.plan(lots, BigDecimal.TEN, CostBasisMethod.SPECIFIC, List.of())).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> CostBasisEngine.plan(lots, BigDecimal.TEN, CostBasisMethod.SPECIFIC, List.of(9L))).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> CostBasisEngine.plan(lots, new BigDecimal("150"), CostBasisMethod.SPECIFIC, List.of(2L))).isInstanceOf(InsufficientQuantityException.class);
        List<CostBasisEngine.Slice> s = CostBasisEngine.plan(lots, BigDecimal.TEN, CostBasisMethod.SPECIFIC, List.of(2L));
        assertThat(s.get(0).lot().getId()).isEqualTo(2L);
        assertThat(s.get(0).cost()).isEqualByComparingTo("120000.00");
    }

    @Test
    void insufficientTotalQuantityIsRejected() {
        assertThatThrownBy(() -> CostBasisEngine.plan(List.of(lot(1, "10", "100")), new BigDecimal("11"), CostBasisMethod.FIFO, null))
                .isInstanceOf(InsufficientQuantityException.class);
    }

    @Test
    void lotStatusTransitions() {
        StockLot l = lot(1, "100", "1000");
        l.consume(new BigDecimal("40"), new BigDecimal("400"));
        assertThat(l.getStatus()).isEqualTo(LotStatus.PARTIAL);
        l.consume(new BigDecimal("60"), new BigDecimal("600"));
        assertThat(l.getStatus()).isEqualTo(LotStatus.CLOSED);
        l.restore(new BigDecimal("100"), new BigDecimal("1000"));
        assertThat(l.getStatus()).isEqualTo(LotStatus.OPEN);
        assertThat(l.unitCost()).isEqualByComparingTo("10");
    }
}
