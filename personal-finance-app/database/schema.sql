-- Full schema (generated from migrations 001-004). Run indexes.sql afterwards.
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
-- V2: assets, liabilities, transactions and the double-entry journal
CREATE TABLE assets (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    code              VARCHAR(40)   NOT NULL,
    name              VARCHAR(160)  NOT NULL,
    asset_type        VARCHAR(20)   NOT NULL CHECK (asset_type IN ('STOCK','BOND','MUTUAL_FUND','ETF','GOLD','DEPOSIT','PROPERTY','LAND','VEHICLE','OTHER')),
    currency          VARCHAR(3)    NOT NULL,
    quantity_unit     VARCHAR(10)   NOT NULL CHECK (quantity_unit IN ('GRAM','LOT','UNIT','SHEET','SHARE','KG','LITER','METER','PIECE','OTHER')),
    sector            VARCHAR(80),
    current_price     NUMERIC(20,6) NOT NULL DEFAULT 0 CHECK (current_price >= 0),
    valuation_date    DATE,
    ledger_account_id BIGINT        NOT NULL UNIQUE REFERENCES chart_of_accounts (id),
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_asset_user_code UNIQUE (user_id, code)
);

CREATE TABLE liabilities (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name              VARCHAR(120)  NOT NULL,
    creditor          VARCHAR(120),
    liability_type    VARCHAR(20)   NOT NULL CHECK (liability_type IN ('LOAN', 'CREDIT_CARD', 'OTHER')),
    currency          VARCHAR(3)    NOT NULL,
    interest_rate     NUMERIC(8,4)  NOT NULL DEFAULT 0 CHECK (interest_rate >= 0),
    tenor_months      INTEGER,
    installment       NUMERIC(20,2),
    due_date          DATE,
    ledger_account_id BIGINT        NOT NULL UNIQUE REFERENCES chart_of_accounts (id),
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Central financial event. Original-currency amounts + exchange rate + base amount (auditable).
CREATE TABLE transactions (
    id                     BIGSERIAL PRIMARY KEY,
    user_id                BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    transaction_date       DATE          NOT NULL,
    transaction_type       VARCHAR(20)   NOT NULL CHECK (transaction_type IN ('INCOME','EXPENSE','TRANSFER','BUY_INVESTMENT','SELL_INVESTMENT',
                                             'DIVIDEND','COUPON','INTEREST','LOAN','DEBT_PAYMENT','ASSET_PURCHASE','ASSET_SALE','FEE','TAX','OPENING_BALANCE')),
    account_id             BIGINT        NOT NULL REFERENCES accounts (id),
    destination_account_id BIGINT        REFERENCES accounts (id),
    category_id            BIGINT        REFERENCES chart_of_accounts (id),
    asset_id               BIGINT        REFERENCES assets (id),
    liability_id           BIGINT        REFERENCES liabilities (id),
    quantity               NUMERIC(20,6) CHECK (quantity IS NULL OR quantity > 0),
    quantity_unit          VARCHAR(10),
    unit_price             NUMERIC(20,6) CHECK (unit_price IS NULL OR unit_price > 0),
    gross_amount           NUMERIC(20,2) NOT NULL CHECK (gross_amount >= 0),
    admin_fee              NUMERIC(20,2) NOT NULL DEFAULT 0 CHECK (admin_fee >= 0),
    broker_fee             NUMERIC(20,2) NOT NULL DEFAULT 0 CHECK (broker_fee >= 0),
    levy                   NUMERIC(20,2) NOT NULL DEFAULT 0 CHECK (levy >= 0),
    tax                    NUMERIC(20,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
    interest_amount        NUMERIC(20,2) NOT NULL DEFAULT 0 CHECK (interest_amount >= 0),
    net_amount             NUMERIC(20,2) NOT NULL,
    cost_basis             NUMERIC(20,2),
    realized_pl            NUMERIC(20,2),
    currency               VARCHAR(3)    NOT NULL,
    exchange_rate          NUMERIC(20,6) NOT NULL DEFAULT 1 CHECK (exchange_rate > 0),
    base_currency          VARCHAR(3)    NOT NULL,
    base_amount            NUMERIC(20,2) NOT NULL,
    reference              VARCHAR(80),
    description            VARCHAR(500),
    status                 VARCHAR(10)   NOT NULL DEFAULT 'POSTED' CHECK (status IN ('POSTED', 'VOID')),
    created_at             TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_transfer_accounts CHECK (destination_account_id IS NULL OR destination_account_id <> account_id)
);

CREATE TABLE journals (
    id             BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT       NOT NULL UNIQUE REFERENCES transactions (id) ON DELETE CASCADE,
    journal_date   DATE         NOT NULL,
    description    VARCHAR(255),
    status         VARCHAR(20)  NOT NULL DEFAULT 'POSTED',
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Always in base currency; a line is either a debit or a credit.
CREATE TABLE journal_entries (
    id                BIGSERIAL PRIMARY KEY,
    journal_id        BIGINT        NOT NULL REFERENCES journals (id) ON DELETE CASCADE,
    ledger_account_id BIGINT        NOT NULL REFERENCES chart_of_accounts (id),
    debit             NUMERIC(20,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
    credit            NUMERIC(20,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
    memo              VARCHAR(255),
    created_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_entry_one_side CHECK (debit = 0 OR credit = 0)
);

-- Database-level guard for the invariant SUM(debit) = SUM(credit) per journal (checked at commit).
CREATE OR REPLACE FUNCTION assert_journal_balanced() RETURNS TRIGGER AS $$
DECLARE d NUMERIC; c NUMERIC; jid BIGINT;
BEGIN
    jid := COALESCE(NEW.journal_id, OLD.journal_id);
    SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0) INTO d, c FROM journal_entries WHERE journal_id = jid;
    IF d <> c THEN RAISE EXCEPTION 'Journal % is unbalanced: debit % <> credit %', jid, d, c; END IF;
    RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_journal_balanced AFTER INSERT OR UPDATE OR DELETE ON journal_entries
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION assert_journal_balanced();
-- V3: investments – lots, lot consumptions and bonds
CREATE TABLE stock_lots (
    id                 BIGSERIAL PRIMARY KEY,
    user_id            BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    asset_id           BIGINT        NOT NULL REFERENCES assets (id),
    transaction_id     BIGINT        NOT NULL UNIQUE REFERENCES transactions (id) ON DELETE CASCADE,
    purchase_date      DATE          NOT NULL,
    quantity           NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
    remaining_quantity NUMERIC(20,6) NOT NULL CHECK (remaining_quantity >= 0 AND remaining_quantity <= quantity),
    total_cost         NUMERIC(20,2) NOT NULL CHECK (total_cost >= 0),
    remaining_cost     NUMERIC(20,2) NOT NULL CHECK (remaining_cost >= 0),
    status             VARCHAR(10)   NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PARTIAL', 'CLOSED')),
    created_at         TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Which lot a disposal consumed and at what cost (FIFO / average / specific audit trail).
CREATE TABLE lot_consumptions (
    id                  BIGSERIAL PRIMARY KEY,
    sell_transaction_id BIGINT        NOT NULL REFERENCES transactions (id) ON DELETE CASCADE,
    lot_id              BIGINT        NOT NULL REFERENCES stock_lots (id),
    quantity            NUMERIC(20,6) NOT NULL CHECK (quantity > 0),
    cost_basis          NUMERIC(20,2) NOT NULL CHECK (cost_basis >= 0),
    created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE bonds (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    asset_id        BIGINT        NOT NULL UNIQUE REFERENCES assets (id),
    issuer          VARCHAR(160),
    bond_type       VARCHAR(40),
    nominal_value   NUMERIC(20,2) NOT NULL CHECK (nominal_value > 0),
    coupon_rate     NUMERIC(8,4)  NOT NULL CHECK (coupon_rate > 0),
    tax_rate        NUMERIC(8,4)  NOT NULL DEFAULT 0 CHECK (tax_rate >= 0),
    frequency       VARCHAR(15)   NOT NULL CHECK (frequency IN ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL')),
    settlement_date DATE          NOT NULL,
    maturity_date   DATE          NOT NULL,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_bond_dates CHECK (maturity_date > settlement_date)
);
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
