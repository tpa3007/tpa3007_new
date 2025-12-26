-- init-db.sql

-- Таблица брендов
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Таблица API ключей
-- UPD: Добавлен 'prefix' для безопасного поиска
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    prefix TEXT NOT NULL,   -- Первые 8 символов ключа
    key_hash TEXT NOT NULL, -- Хеш полного ключа (bcrypt)
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys (prefix);

-- Таблица платежей
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL,
    amount_usdt NUMERIC(18, 6) NOT NULL,
    amount_original NUMERIC(18, 6), -- Исходная сумма (fiat)
    currency_original VARCHAR(10),  -- Валюта (RUB, USD)
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'paid', 'expired', 'failed')),
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    paid_at TIMESTAMPTZ,
    sweeped_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_expires_at ON payments (expires_at) WHERE status = 'waiting';

-- Таблица адресов
-- UPD: Добавлен 'aes_key' для хранения ключа шифрования (чтобы Sweeper мог расшифровать)
CREATE TABLE IF NOT EXISTS payment_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    address TEXT UNIQUE NOT NULL,
    encrypted_mnemonic BYTEA NOT NULL,
    aes_key BYTEA NOT NULL, -- Ключ шифрования этой записи
    aes_iv BYTEA NOT NULL,
    aes_tag BYTEA NOT NULL,
    sweeped_at TIMESTAMPTZ,
    sweep_tx_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_payment_addresses_address ON payment_addresses (address);
CREATE INDEX IF NOT EXISTS idx_payment_addresses_sweeped_at_null ON payment_addresses (sweeped_at) WHERE sweeped_at IS NULL;

-- Логи вебхуков
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL DEFAULT 1,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE EXTENSION IF NOT EXISTS pgcrypto;