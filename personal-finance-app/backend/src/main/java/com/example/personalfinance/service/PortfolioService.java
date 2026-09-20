package com.example.personalfinance.service;

import com.example.personalfinance.domain.asset.Asset;
import com.example.personalfinance.domain.common.Money;
import com.example.personalfinance.domain.portfolio.CostBasisEngine;
import com.example.personalfinance.domain.portfolio.LotConsumption;
import com.example.personalfinance.domain.portfolio.StockLot;
import com.example.personalfinance.domain.transaction.Transaction;
import com.example.personalfinance.domain.user.User;
import com.example.personalfinance.dto.response.AssetResponse;
import com.example.personalfinance.dto.response.LotConsumptionResponse;
import com.example.personalfinance.dto.response.PortfolioResponse;
import com.example.personalfinance.dto.response.StockLotResponse;
import com.example.personalfinance.exception.BusinessException;
import com.example.personalfinance.mapper.DtoMapper;
import com.example.personalfinance.repository.AssetRepository;
import com.example.personalfinance.repository.LotConsumptionRepository;
import com.example.personalfinance.repository.StockLotRepository;
import com.example.personalfinance.repository.TransactionRepository;
import com.example.personalfinance.repository.projection.AssetAmount;
import com.example.personalfinance.repository.projection.PositionRow;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Lot bookkeeping (create on buy, consume on sell) and position/valuation reporting derived from lots. */
@Service
@RequiredArgsConstructor
@Transactional
public class PortfolioService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final StockLotRepository lots;
    private final LotConsumptionRepository consumptions;
    private final AssetRepository assets;
    private final TransactionRepository transactions;

    /** Creates a lot for acquisitions or consumes lots for disposals (setting cost basis and realized P/L on the transaction). */
    public void applyLots(Transaction tx, List<Long> specificLotIds) {
        if (tx.getType().isAcquisition()) {
            StockLot lot = new StockLot();
            lot.setUser(tx.getUser());
            lot.setAsset(tx.getAsset());
            lot.setTransaction(tx);
            lot.setPurchaseDate(tx.getTransactionDate());
            lot.setQuantity(tx.getQuantity());
            lot.setRemainingQuantity(tx.getQuantity());
            lot.setTotalCost(tx.getNetAmount());
            lot.setRemainingCost(tx.getNetAmount());
            lots.save(lot);
        } else if (tx.getType().isDisposal()) {
            List<StockLot> open = lots.findOpenLots(tx.getUser().getId(), tx.getAsset().getId());
            BigDecimal costBasis = Money.ZERO;
            for (CostBasisEngine.Slice s : CostBasisEngine.plan(open, tx.getQuantity(), tx.getUser().getCostBasisMethod(), specificLotIds)) {
                s.lot().consume(s.quantity(), s.cost());
                consumptions.save(LotConsumption.of(tx, s.lot(), s.quantity(), s.cost()));
                costBasis = costBasis.add(s.cost());
            }
            tx.setCostBasis(costBasis);
            tx.setRealizedPl(tx.getGrossAmount().subtract(costBasis));
        }
    }

    /** Undoes {@link #applyLots}; a purchase whose lot was already (partially) sold cannot be reverted. */
    public void revertLots(Transaction tx) {
        if (tx.getType().isAcquisition()) {
            StockLot lot = lots.findByTransactionId(tx.getId()).orElseThrow();
            if (consumptions.existsByLotId(lot.getId()))
                throw new BusinessException("LOT_CONSUMED", "Transaksi pembelian tidak dapat diubah karena lot sudah terjual");
            lots.delete(lot);
            lots.flush();
        } else if (tx.getType().isDisposal()) {
            for (LotConsumption c : consumptions.findBySellTransactionId(tx.getId())) {
                c.getLot().restore(c.getQuantity(), c.getCostBasis());
                consumptions.delete(c);
            }
            tx.setCostBasis(null);
            tx.setRealizedPl(null);
        }
    }

    /** All assets with derived quantity, cost, market value and P/L; {@code heldOnly} filters to open positions. */
    @Transactional(readOnly = true)
    public List<AssetResponse> positions(User user, boolean heldOnly) {
        Map<Long, PositionRow> pos = lots.positions(user.getId()).stream().collect(Collectors.toMap(PositionRow::assetId, p -> p));
        Map<Long, BigDecimal> realized = transactions.realizedPlByAsset(user.getId()).stream()
                .collect(Collectors.toMap(AssetAmount::assetId, AssetAmount::amount));
        List<Asset> all = assets.findByUserIdOrderByCode(user.getId());
        BigDecimal totalMarket = all.stream().map(a -> marketValue(a, pos)).reduce(Money.ZERO, BigDecimal::add);
        return all.stream()
                .filter(a -> !heldOnly || quantity(a, pos).signum() > 0)
                .map(a -> toResponse(a, quantity(a, pos), cost(a, pos), realized.getOrDefault(a.getId(), Money.ZERO), totalMarket))
                .toList();
    }

    @Transactional(readOnly = true)
    public PortfolioResponse portfolio(User user) {
        List<AssetResponse> held = positions(user, true);
        BigDecimal cost = held.stream().map(AssetResponse::totalCost).reduce(Money.ZERO, BigDecimal::add);
        BigDecimal market = held.stream().map(AssetResponse::marketValue).reduce(Money.ZERO, BigDecimal::add);
        BigDecimal realized = positions(user, false).stream().map(AssetResponse::realizedPl).reduce(Money.ZERO, BigDecimal::add);
        BigDecimal unrealized = market.subtract(cost);
        return new PortfolioResponse(cost, market, unrealized, percent(unrealized, cost), realized, held);
    }

    @Transactional(readOnly = true)
    public List<StockLotResponse> lots(User user, Long assetId) {
        List<StockLot> list = assetId == null ? lots.findByUserIdOrderByPurchaseDateAscIdAsc(user.getId())
                : lots.findByUserIdAndAssetIdOrderByPurchaseDateAscIdAsc(user.getId(), assetId);
        return list.stream().map(DtoMapper::lot).toList();
    }

    @Transactional(readOnly = true)
    public List<LotConsumptionResponse> consumptions(Long transactionId) {
        return consumptions.findBySellTransactionId(transactionId).stream().map(DtoMapper::consumption).toList();
    }

    private static BigDecimal quantity(Asset a, Map<Long, PositionRow> pos) {
        PositionRow p = pos.get(a.getId());
        return p == null ? BigDecimal.ZERO : p.quantity();
    }

    private static BigDecimal cost(Asset a, Map<Long, PositionRow> pos) {
        PositionRow p = pos.get(a.getId());
        return p == null ? Money.ZERO : p.cost();
    }

    private static BigDecimal marketValue(Asset a, Map<Long, PositionRow> pos) {
        return Money.mul(quantity(a, pos), a.getCurrentPrice());
    }

    /** Percentage of {@code part} over {@code base}, 0 when base is zero. */
    public static BigDecimal percent(BigDecimal part, BigDecimal base) {
        return base.signum() == 0 ? Money.ZERO : part.multiply(HUNDRED).divide(base, 2, RoundingMode.HALF_UP);
    }

    private static AssetResponse toResponse(Asset a, BigDecimal qty, BigDecimal cost, BigDecimal realized, BigDecimal totalMarket) {
        BigDecimal market = Money.mul(qty, a.getCurrentPrice());
        BigDecimal unrealized = market.subtract(cost);
        BigDecimal avg = qty.signum() == 0 ? Money.ZERO : cost.divide(qty, 2, RoundingMode.HALF_UP);
        return new AssetResponse(a.getId(), a.getCode(), a.getName(), a.getAssetType(), a.getCurrency(), a.getQuantityUnit(), a.getSector(),
                a.getCurrentPrice(), a.getValuationDate(), a.getLedgerAccount().getCode(), qty, avg, cost, market, unrealized,
                percent(unrealized, cost), realized, percent(market, totalMarket));
    }
}
