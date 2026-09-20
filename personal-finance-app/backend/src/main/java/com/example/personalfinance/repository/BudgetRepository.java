package com.example.personalfinance.repository;

import com.example.personalfinance.domain.planning.Budget;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    @EntityGraph(attributePaths = "category")
    List<Budget> findByUserIdAndPeriodMonthOrderByCategoryCode(Long userId, String periodMonth);

    Optional<Budget> findByUserIdAndCategoryIdAndPeriodMonth(Long userId, Long categoryId, String periodMonth);

    Optional<Budget> findByIdAndUserId(Long id, Long userId);
}
