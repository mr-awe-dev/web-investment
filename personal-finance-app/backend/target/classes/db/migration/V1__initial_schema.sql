-- V1: users and chart of accounts (ledger accounts)
CREATE TABLE users (
    id                BIGSERIAL PRIMARY KEY,
    email             VARCHAR(160) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    full_name         VARCHAR(120) NOT NULL,
    base_currency     VARCHAR(3)   NOT NULL DEFAULT 'IDR',
    cost_basis_method VARCHAR(20)  NOT NULL DEFAULT 'FIFO' CHECK (cost_basis_method IN ('FIFO', 'AVERAGE', 'SPECIFIC')),
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Ledger accounts. Money accounts, assets and liabilities each own a dedicated child (e.g. 1200.01).
CREATE TABLE chart_of_accounts (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    code        VARCHAR(20)  NOT NULL,
    name        VARCHAR(120) NOT NULL,
    type        VARCHAR(20)  NOT NULL CHECK (type IN ('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE')),
    parent_code VARCHAR(20),
    cash        BOOLEAN      NOT NULL DEFAULT FALSE,
    system      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_coa_user_code UNIQUE (user_id, code)
);

CREATE TABLE accounts (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name              VARCHAR(120) NOT NULL,
    category          VARCHAR(20)  NOT NULL CHECK (category IN ('BANK', 'RDN', 'CASH', 'EWALLET', 'DEPOSIT')),
    currency          VARCHAR(3)   NOT NULL,
    institution       VARCHAR(120),
    ledger_account_id BIGINT       NOT NULL UNIQUE REFERENCES chart_of_accounts (id),
    active            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);
