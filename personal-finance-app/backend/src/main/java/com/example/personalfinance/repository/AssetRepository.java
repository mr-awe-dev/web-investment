package com.example.personalfinance.repository;

import com.example.personalfinance.domain.asset.Asset;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssetRepository extends JpaRepository<Asset, Long> {
    @EntityGraph(attributePaths = "ledgerAccount")
    List<Asset> findByUserIdOrderByCode(Long userId);

    @EntityGraph(attributePaths = "ledgerAccount")
    Optional<Asset> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndCode(Long userId, String code);
}
