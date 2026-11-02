-- ==============================================================================
-- AlumNect Database Migration - Version 11
-- Feature: UC93 - Thanh toán gói Mentor qua PayOS (Mentor Subscription Payment)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- 1. Bảng payment_transactions: Lưu vết giao dịch thanh toán gói Mentor qua cổng PayOS
CREATE TABLE payment_transactions (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id                 BIGINT NOT NULL,
    mentor_subscription_id  BIGINT NOT NULL,
    order_code              BIGINT NOT NULL UNIQUE,
    amount                  NUMERIC(12, 2) NOT NULL,
    transaction_type        VARCHAR(50) NOT NULL DEFAULT 'MENTOR_SUBSCRIPTION',
    payment_status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method          VARCHAR(50) NOT NULL DEFAULT 'PAYOS',
    payment_reference       VARCHAR(100),
    description             VARCHAR(255),
    qr_code_url             TEXT,
    checkout_url            TEXT,
    payment_expires_at      TIMESTAMPTZ NOT NULL,
    paid_at                 TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_payment_transactions_type CHECK (transaction_type IN ('MENTOR_SUBSCRIPTION')),
    CONSTRAINT ck_payment_transactions_status CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED')),
    CONSTRAINT ck_payment_transactions_amount CHECK (amount >= 0)
);

-- 2. Cập nhật ràng buộc trạng thái của mentor_subscriptions hỗ trợ trạng thái ACTIVE sau thanh toán
ALTER TABLE mentor_subscriptions 
    DROP CONSTRAINT IF EXISTS ck_mentor_subscriptions_status;

ALTER TABLE mentor_subscriptions 
    ADD CONSTRAINT ck_mentor_subscriptions_status 
    CHECK (status IN ('PENDING_PAYMENT', 'ACTIVE', 'PAID', 'CANCELLED', 'EXPIRED'));

-- ==============================================================================
-- FOREIGN KEY CONSTRAINTS (Khai báo ở cuối file, không tạo FK vòng)
-- ==============================================================================
ALTER TABLE payment_transactions 
    ADD CONSTRAINT fk_payment_transactions_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE payment_transactions 
    ADD CONSTRAINT fk_payment_transactions_subscription 
    FOREIGN KEY (mentor_subscription_id) REFERENCES mentor_subscriptions(id) ON DELETE CASCADE;

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX idx_payment_transactions_order_code ON payment_transactions (order_code);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions (user_id);
CREATE INDEX idx_payment_transactions_subscription_id ON payment_transactions (mentor_subscription_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions (payment_status);
