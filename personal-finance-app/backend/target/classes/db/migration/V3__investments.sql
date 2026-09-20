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
