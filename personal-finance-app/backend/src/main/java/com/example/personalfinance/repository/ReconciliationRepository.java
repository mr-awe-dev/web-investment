package com.example.personalfinance.repository;

import com.example.personalfinance.domain.reconciliation.Reconciliation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReconciliationRepository extends JpaRepository<Reconciliation, Long> {
    @EntityGraph(attributePaths = "account")
    List<Reconciliation> findByUserIdOrderByReconciliationDateDescIdDesc(Long userId);
}
