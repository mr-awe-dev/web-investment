package com.example.personalfinance.repository;

import com.example.personalfinance.domain.liability.Liability;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LiabilityRepository extends JpaRepository<Liability, Long> {
    @EntityGraph(attributePaths = "ledgerAccount")
    List<Liability> findByUserIdOrderByName(Long userId);

    @EntityGraph(attributePaths = "ledgerAccount")
    Optional<Liability> findByIdAndUserId(Long id, Long userId);
}
