package com.example.personalfinance.repository;

import com.example.personalfinance.domain.accounting.ChartOfAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChartOfAccountRepository extends JpaRepository<ChartOfAccount, Long> {
    List<ChartOfAccount> findByUserIdOrderByCode(Long userId);
    Optional<ChartOfAccount> findByUserIdAndCode(Long userId, String code);
    Optional<ChartOfAccount> findByIdAndUserId(Long id, Long userId);
    long countByUserIdAndParentCode(Long userId, String parentCode);
}
