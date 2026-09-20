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
