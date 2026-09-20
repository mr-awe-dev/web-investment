-- V4: planning, reconciliation, attachments metadata and audit log
CREATE TABLE budgets (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category_id  BIGINT        NOT NULL REFERENCES chart_of_accounts (id),
    period_month VARCHAR(7)    NOT NULL CHECK (period_month ~ '^\d{4}-\d{2}$'),
    amount       NUMERIC(20,2) NOT NULL CHECK (amount > 0),
    created_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_budget UNIQUE (user_id, category_id, period_month)
);

CREATE TABLE reconciliations (
    id                  BIGSERIAL PRIMARY KEY,
    user_id             BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    account_id          BIGINT        NOT NULL REFERENCES accounts (id),
    reconciliation_date DATE          NOT NULL,
    system_balance      NUMERIC(20,2) NOT NULL,
    actual_balance      NUMERIC(20,2) NOT NULL,
    difference          NUMERIC(20,2) NOT NULL,
    status              VARCHAR(20)   NOT NULL CHECK (status IN ('RECONCILED', 'DIFFERENCE_FOUND', 'PENDING_REVIEW')),
    notes               VARCHAR(500),
    created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Metadata only; binary files live in object storage / filesystem, never in PostgreSQL.
CREATE TABLE attachments (
    id             BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT       NOT NULL REFERENCES transactions (id) ON DELETE CASCADE,
    file_name      VARCHAR(255) NOT NULL,
    mime_type      VARCHAR(100) NOT NULL,
    file_size      BIGINT       NOT NULL CHECK (file_size >= 0),
    storage_path   VARCHAR(500) NOT NULL,
    storage_key    VARCHAR(255) NOT NULL UNIQUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT      REFERENCES users (id) ON DELETE SET NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id   BIGINT      NOT NULL,
    action      VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VOID')),
    payload     JSONB,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Cash flow is derived, never stored: journal lines on cash accounts classified by transaction type.
CREATE OR REPLACE VIEW v_cash_flow AS
SELECT t.user_id, j.journal_date, t.transaction_type,
       CASE t.transaction_type
           WHEN 'TRANSFER' THEN 'NONE'
           WHEN 'INCOME' THEN 'OPERATING' WHEN 'EXPENSE' THEN 'OPERATING' WHEN 'INTEREST' THEN 'OPERATING'
           WHEN 'FEE' THEN 'OPERATING' WHEN 'TAX' THEN 'OPERATING'
           WHEN 'LOAN' THEN 'FINANCING' WHEN 'DEBT_PAYMENT' THEN 'FINANCING' WHEN 'OPENING_BALANCE' THEN 'FINANCING'
           ELSE 'INVESTING' END AS cash_flow_category,
       SUM(e.debit - e.credit) AS amount
FROM journal_entries e
JOIN journals j ON j.id = e.journal_id
JOIN transactions t ON t.id = j.transaction_id
JOIN chart_of_accounts c ON c.id = e.ledger_account_id
WHERE c.cash = TRUE
GROUP BY t.user_id, j.journal_date, t.transaction_type;
