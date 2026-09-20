package com.example.personalfinance.repository;

import com.example.personalfinance.domain.bond.Bond;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BondRepository extends JpaRepository<Bond, Long> {
    @EntityGraph(attributePaths = "asset")
    List<Bond> findByUserIdOrderByMaturityDate(Long userId);

    @EntityGraph(attributePaths = "asset")
    Optional<Bond> findByIdAndUserId(Long id, Long userId);
}
