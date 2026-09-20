package com.example.personalfinance.domain.transaction;

/** Lifecycle of a transaction; VOID transactions have no journal and no financial effect. */
public enum TransactionStatus { POSTED, VOID }
