package com.example.personalfinance.repository;

import com.example.personalfinance.domain.account.Account;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    @EntityGraph(attributePaths = "ledgerAccount")
    List<Account> findByUserIdOrderByName(Long userId);

    @EntityGraph(attributePaths = "ledgerAccount")
    Optional<Account> findByIdAndUserId(Long id, Long userId);
}
