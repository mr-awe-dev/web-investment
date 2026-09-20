package com.example.personalfinance.repository;

import com.example.personalfinance.domain.accounting.Journal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JournalRepository extends JpaRepository<Journal, Long> {
    Optional<Journal> findByTransactionId(Long transactionId);
}
