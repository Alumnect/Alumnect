-- ==============================================================================
-- AlumNect Database Migration - Version 5
-- Feature: UC92 - Xem & Chọn Gói Mentor (Mentor Subscription & Package Selection)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- 1. Bảng mentor_packages: Lưu các gói dịch vụ Mentor do Admin cấu hình
CREATE TABLE mentor_packages (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    duration_months INTEGER NOT NULL,
    price           NUMERIC(12, 2) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentor_packages_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT ck_mentor_packages_duration CHECK (duration_months > 0),
    CONSTRAINT ck_mentor_packages_price CHECK (price >= 0)
);

-- 2. Bảng mentor_subscriptions: Lưu thông tin đăng ký / chọn gói Mentor chuẩn bị thanh toán (UC92 -> UC93)
CREATE TABLE mentor_subscriptions (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mentor_profile_id BIGINT NOT NULL,
    package_id        BIGINT NOT NULL,
    price_at_purchase NUMERIC(12, 2) NOT NULL,
    duration_months   INTEGER NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING_PAYMENT',
    start_date        TIMESTAMPTZ,
    end_date          TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentor_subscriptions_status CHECK (status IN ('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT ck_mentor_subscriptions_duration CHECK (duration_months > 0),
    CONSTRAINT ck_mentor_subscriptions_price CHECK (price_at_purchase >= 0)
);

-- ==============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ==============================================================================
ALTER TABLE mentor_subscriptions 
    ADD CONSTRAINT fk_mentor_subscriptions_profile 
    FOREIGN KEY (mentor_profile_id) REFERENCES mentor_profiles(id) ON DELETE CASCADE;

ALTER TABLE mentor_subscriptions 
    ADD CONSTRAINT fk_mentor_subscriptions_package 
    FOREIGN KEY (package_id) REFERENCES mentor_packages(id) ON DELETE RESTRICT;

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX idx_mentor_packages_status ON mentor_packages (status);
CREATE INDEX idx_mentor_subscriptions_profile_id ON mentor_subscriptions (mentor_profile_id);
CREATE INDEX idx_mentor_subscriptions_status ON mentor_subscriptions (status);

-- ==============================================================================
-- SEED DATA: Thêm các gói Mentor mặc định theo quy tắc (1 tháng, 3 tháng, 6 tháng)
-- ==============================================================================
INSERT INTO mentor_packages (code, name, description, duration_months, price, status)
VALUES 
    ('1 Tháng', 'Gói Tiêu Chuẩn 1 Tháng', 'Gói trải nghiệm kết nối cố vấn trong vòng 1 tháng dành cho Alumni mới gia nhập.', 1, 100000.00, 'ACTIVE'),
    ('3 Tháng', 'Gói Phổ Biến 3 Tháng', 'Gói cố vấn 3 tháng tối ưu chi phí, được khuyên dùng nhất cho các Mentor chính thức.', 3, 250000.00, 'ACTIVE'),
    ('6 Tháng', 'Gói Cao Cấp 6 Tháng', 'Gói đồng hành cố vấn dài hạn 6 tháng với ưu đãi tiết kiệm cao nhất.', 6, 500000.00, 'ACTIVE');

-- Index hỗ trợ Admin truy vấn nhanh CV của Mentor theo mentor_profile_id và cv_file_key (UC96)
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_cv_lookup ON mentor_profiles(id, cv_file_key) WHERE cv_file_key IS NOT NULL;

