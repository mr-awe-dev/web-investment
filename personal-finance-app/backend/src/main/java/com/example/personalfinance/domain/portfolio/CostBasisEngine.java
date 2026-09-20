package com.example.personalfinance.domain.portfolio;

import com.example.personalfinance.domain.common.Money;
import com.example.personalfinance.exception.BusinessException;
import com.example.personalfinance.exception.InsufficientQuantityException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Pure cost-basis engine (no persistence). Given the open lots of an asset it decides which lots a disposal
 * consumes and the cost basis of each slice, according to FIFO, average cost or specific identification.
 */
public final class CostBasisEngine {

    /** Planned consumption of one lot. */
    public record Slice(StockLot lot, BigDecimal quantity, BigDecimal cost) {}

    private CostBasisEngine() {}

    /**
     * @param openLots   lots with remaining quantity, ordered by purchase date ascending
     * @param quantity   quantity to dispose
     * @param method     cost-basis method
     * @param specificLotIds lot ids in consumption order, only for SPECIFIC
     */
    public static List<Slice> plan(List<StockLot> openLots, BigDecimal quantity, CostBasisMethod method, List<Long> specificLotIds) {
        BigDecimal available = openLots.stream().map(StockLot::getRemainingQuantity).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (available.compareTo(quantity) < 0) throw new InsufficientQuantityException();
        return switch (method) {
            case FIFO -> consume(openLots, quantity, null);
            case AVERAGE -> consume(openLots, quantity, averageUnitCost(openLots, available));
            case SPECIFIC -> consume(pickSpecific(openLots, specificLotIds), quantity, null);
        };
    }

    private static BigDecimal averageUnitCost(List<StockLot> lots, BigDecimal available) {
        BigDecimal cost = lots.stream().map(StockLot::getRemainingCost).reduce(BigDecimal.ZERO, BigDecimal::add);
        return cost.divide(available, 10, RoundingMode.HALF_UP);
    }

    private static List<StockLot> pickSpecific(List<StockLot> lots, List<Long> ids) {
        if (ids == null || ids.isEmpty()) throw new BusinessException("LOT_REQUIRED", "Pilih lot untuk metode identifikasi spesifik");
        Map<Long, StockLot> byId = lots.stream().collect(Collectors.toMap(StockLot::getId, Function.identity()));
        List<StockLot> picked = new ArrayList<>();
        for (Long id : ids) {
            StockLot lot = byId.get(id);
            if (lot == null) throw new BusinessException("LOT_NOT_AVAILABLE", "Lot " + id + " tidak tersedia untuk aset ini");
            picked.add(lot);
        }
        return picked;
    }

    /** Walks lots in order; unit cost is the lot's own cost unless an average override is given. */
    private static List<Slice> consume(List<StockLot> lots, BigDecimal quantity, BigDecimal averageUnitCost) {
        List<Slice> slices = new ArrayList<>();
        BigDecimal left = quantity;
        for (StockLot lot : lots) {
            if (left.signum() == 0) break;
            BigDecimal take = left.min(lot.getRemainingQuantity());
            boolean wholeLot = take.compareTo(lot.getRemainingQuantity()) == 0;
            BigDecimal cost = averageUnitCost == null && wholeLot
                    ? lot.getRemainingCost()
                    : Money.mul(take, averageUnitCost == null ? lot.unitCost() : averageUnitCost);
            slices.add(new Slice(lot, take, cost));
            left = left.subtract(take);
        }
        if (left.signum() != 0) throw new InsufficientQuantityException();
        return slices;
    }
}
