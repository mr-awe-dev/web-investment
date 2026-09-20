package com.example.personalfinance.repository;

import com.example.personalfinance.domain.portfolio.StockLot;
import com.example.personalfinance.repository.projection.PositionRow;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface StockLotRepository extends JpaRepository<StockLot, Long> {

    @Query("select l from StockLot l where l.user.id = :userId and l.asset.id = :assetId and l.remainingQuantity > 0 order by l.purchaseDate, l.id")
    List<StockLot> findOpenLots(Long userId, Long assetId);

    @EntityGraph(attributePaths = "asset")
    List<StockLot> findByUserIdOrderByPurchaseDateAscIdAsc(Long userId);

    @EntityGraph(attributePaths = "asset")
    List<StockLot> findByUserIdAndAssetIdOrderByPurchaseDateAscIdAsc(Long userId, Long assetId);

    Optional<StockLot> findByTransactionId(Long transactionId);

    /** Remaining quantity and cost per asset = current positions. */
    @Query("select new com.example.personalfinance.repository.projection.PositionRow(l.asset.id, sum(l.remainingQuantity), sum(l.remainingCost)) " +
            "from StockLot l where l.user.id = :userId group by l.asset.id")
    List<PositionRow> positions(Long userId);
}
