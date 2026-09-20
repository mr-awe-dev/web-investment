package com.example.personalfinance.repository;

import com.example.personalfinance.domain.portfolio.LotConsumption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LotConsumptionRepository extends JpaRepository<LotConsumption, Long> {
    @Query("select c from LotConsumption c join fetch c.lot where c.sellTransaction.id = :transactionId order by c.id")
    List<LotConsumption> findBySellTransactionId(Long transactionId);

    boolean existsByLotId(Long lotId);
}
