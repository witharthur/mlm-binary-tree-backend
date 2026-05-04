-- ============================================================
-- MLM Platform — Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------
-- PACKAGES
-- -----------------------------------------------------------
CREATE TABLE packages (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50)    NOT NULL UNIQUE,
    price       NUMERIC(20,4)  NOT NULL CHECK (price >= 0),
    pv_value    INTEGER        NOT NULL CHECK (pv_value >= 0),
    is_active   BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);

INSERT INTO packages (name, price, pv_value) VALUES
    ('START',    100.0000,   100),
    ('BUSINESS', 500.0000,   500),
    ('VIP',     1500.0000,  1500),
    ('ELITE',   5000.0000,  5000);

-- -----------------------------------------------------------
-- USERS
-- -----------------------------------------------------------
CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username         VARCHAR(50)  NOT NULL UNIQUE,
    email            VARCHAR(255) NOT NULL UNIQUE,
    hashed_password  VARCHAR(255) NOT NULL,

    -- referral / tree
    sponsor_id       UUID         REFERENCES users(id),
    parent_id        UUID         REFERENCES users(id),
    placement_side   CHAR(1)      CHECK (placement_side IN ('L','R')),
    left_child_id    UUID         REFERENCES users(id),
    right_child_id   UUID         REFERENCES users(id),

    -- PV accumulators
    left_pv          NUMERIC(20,4) NOT NULL DEFAULT 0,
    right_pv         NUMERIC(20,4) NOT NULL DEFAULT 0,
    left_pv_carry    NUMERIC(20,4) NOT NULL DEFAULT 0,
    right_pv_carry   NUMERIC(20,4) NOT NULL DEFAULT 0,

    package_id       INTEGER       REFERENCES packages(id),
    is_active        BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_sponsor    ON users(sponsor_id);
CREATE INDEX idx_users_parent     ON users(parent_id);
CREATE INDEX idx_users_left_child ON users(left_child_id);
CREATE INDEX idx_users_right_child ON users(right_child_id);

-- -----------------------------------------------------------
-- WALLETS
-- -----------------------------------------------------------
CREATE TABLE wallets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID           NOT NULL UNIQUE REFERENCES users(id),
    main_balance    NUMERIC(20,4)  NOT NULL DEFAULT 0 CHECK (main_balance >= 0),
    deposit_balance NUMERIC(20,4)  NOT NULL DEFAULT 0 CHECK (deposit_balance >= 0),
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- TRANSACTIONS
-- -----------------------------------------------------------
CREATE TYPE tx_type AS ENUM (
    'DEPOSIT','WITHDRAWAL','BONUS_REFERRAL','BONUS_BINARY',
    'PACKAGE_PURCHASE','PACKAGE_UPGRADE','TRANSFER'
);
CREATE TYPE balance_type AS ENUM ('MAIN','DEPOSIT');

CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id       UUID           NOT NULL REFERENCES wallets(id),
    type            tx_type        NOT NULL,
    amount          NUMERIC(20,4)  NOT NULL,
    balance_type    balance_type   NOT NULL DEFAULT 'MAIN',
    description     TEXT,
    idempotency_key VARCHAR(255)   NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_tx_wallet   ON transactions(wallet_id);
CREATE INDEX idx_tx_idemp    ON transactions(idempotency_key);

-- -----------------------------------------------------------
-- ORDERS
-- -----------------------------------------------------------
CREATE TYPE order_status AS ENUM ('PENDING','COMPLETED','CANCELLED');

CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID           NOT NULL REFERENCES users(id),
    package_id      INTEGER        NOT NULL REFERENCES packages(id),
    amount          NUMERIC(20,4)  NOT NULL,
    status          order_status   NOT NULL DEFAULT 'PENDING',
    idempotency_key VARCHAR(255)   NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- BONUS LOGS  (idempotent, no double accrual)
-- -----------------------------------------------------------
CREATE TYPE bonus_type AS ENUM ('REFERRAL','BINARY');

CREATE TABLE bonus_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID          NOT NULL REFERENCES users(id),
    type            bonus_type    NOT NULL,
    amount          NUMERIC(20,4) NOT NULL,
    source_user_id  UUID          REFERENCES users(id),
    idempotency_key VARCHAR(255)  NOT NULL UNIQUE,
    meta            JSONB,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_bonus_user  ON bonus_logs(user_id);
CREATE INDEX idx_bonus_idemp ON bonus_logs(idempotency_key);

-- -----------------------------------------------------------
-- PV EVENTS  (batch-processable for 100k+ users)
-- -----------------------------------------------------------
CREATE TABLE pv_events (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID          NOT NULL REFERENCES users(id),
    pv_amount   INTEGER       NOT NULL,
    processed   BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_pv_unprocessed ON pv_events(processed) WHERE processed = FALSE;

-- -----------------------------------------------------------
-- WITHDRAWALS
-- -----------------------------------------------------------
CREATE TYPE withdrawal_status AS ENUM ('PENDING','APPROVED','REJECTED','COMPLETED');

CREATE TABLE withdrawals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID              NOT NULL REFERENCES users(id),
    amount          NUMERIC(20,4)     NOT NULL CHECK (amount > 0),
    status          withdrawal_status NOT NULL DEFAULT 'PENDING',
    payment_details JSONB,
    admin_note      TEXT,
    created_at      TIMESTAMPTZ       NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ       NOT NULL DEFAULT now()
);
