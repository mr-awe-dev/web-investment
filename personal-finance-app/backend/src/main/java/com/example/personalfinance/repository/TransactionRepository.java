package com.example.personalfinance.repository;

import com.example.personalfinance.domain.transaction.Transaction;
import com.example.personalfinance.repository.projection.AssetAmount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {
    @EntityGraph(attributePaths = {"account", "destinationAccount", "category", "asset", "liability"})
    Optional<Transaction> findByIdAndUserId(Long id, Long userId);

    @Override
    @EntityGraph(attributePaths = {"account", "destinationAccount", "category", "asset", "liability"})
    Page<Transaction> findAll(Specification<Transaction> spec, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = {"account", "destinationAccount", "category", "asset", "liability"})
    List<Transaction> findAll(Specification<Transaction> spec);

    boolean existsByUserId(Long userId);

    /** Realized P/L per asset from posted disposals. */
    @Query("select new com.example.personalfinance.repository.projection.AssetAmount(t.asset.id, sum(t.realizedPl)) " +
            "from Transaction t where t.user.id = :userId and t.status = com.example.personalfinance.domain.transaction.TransactionStatus.POSTED " +
            "and t.realizedPl is not null group by t.asset.id")
    List<AssetAmount> realizedPlByAsset(Long userId);
}
