-- ==============================================================================
-- AlumNect Database Migration - Version 4
-- Feature: Module Hướng dẫn & Hỗ trợ (Mentoring - UC90, UC91)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- 1. Bảng user_terms_acceptances: Lưu lịch sử chấp nhận điều khoản cố vấn (UC90)
CREATE TABLE user_terms_acceptances (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        BIGINT NOT NULL,
    terms_version  VARCHAR(20) NOT NULL,
    accepted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_terms_acceptances_user_version UNIQUE (user_id, terms_version)
);

-- 2. Bảng mentor_profiles: Lưu trữ thông tin hồ sơ cố vấn đặc thù của Alumni (UC91)
CREATE TABLE mentor_profiles (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT NOT NULL UNIQUE,
    years_of_experience INTEGER,
    bio                 TEXT,
    working_mode        VARCHAR(20),
    mentoring_type      VARCHAR(20),
    cv_file_key         VARCHAR(255),
    mentor_status       VARCHAR(20) NOT NULL DEFAULT 'INCOMPLETE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentor_profiles_working_mode CHECK (working_mode IS NULL OR working_mode IN ('ONLINE', 'OFFLINE', 'BOTH')),
    CONSTRAINT ck_mentor_profiles_mentoring_type CHECK (mentoring_type IS NULL OR mentoring_type IN ('INDIVIDUAL', 'GROUP', 'BOTH')),
    CONSTRAINT ck_mentor_profiles_status CHECK (mentor_status IN ('INCOMPLETE', 'PAYMENT_PENDING', 'ACTIVE', 'EXPIRED')),
    CONSTRAINT ck_mentor_profiles_years_exp CHECK (years_of_experience IS NULL OR years_of_experience >= 0)
);

-- 3. Bảng mentor_supported_fields: Liên kết lĩnh vực hỗ trợ chuẩn với industries
CREATE TABLE mentor_supported_fields (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mentor_profile_id   BIGINT NOT NULL,
    industry_id         BIGINT NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_mentor_supported_fields UNIQUE (mentor_profile_id, industry_id)
);

-- 4. Bảng mentor_topics: Lưu các chủ đề cố vấn chuyên sâu tự do của Mentor
CREATE TABLE mentor_topics (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mentor_profile_id   BIGINT NOT NULL,
    topic_name          VARCHAR(150) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_mentor_topics UNIQUE (mentor_profile_id, topic_name)
);

-- 5. Bảng mentor_payout_accounts: Lưu thông tin tài khoản ngân hàng nhận chi trả (Private 1-1)
CREATE TABLE mentor_payout_accounts (
    mentor_profile_id   BIGINT PRIMARY KEY,
    bank_name           VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_account_holder VARCHAR(150),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ==============================================================================
ALTER TABLE user_terms_acceptances 
    ADD CONSTRAINT fk_user_terms_acceptances_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE mentor_profiles 
    ADD CONSTRAINT fk_mentor_profiles_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE mentor_supported_fields 
    ADD CONSTRAINT fk_mentor_supported_fields_profile 
    FOREIGN KEY (mentor_profile_id) REFERENCES mentor_profiles(id) ON DELETE CASCADE;

ALTER TABLE mentor_supported_fields 
    ADD CONSTRAINT fk_mentor_supported_fields_industry 
    FOREIGN KEY (industry_id) REFERENCES industries(id) ON DELETE RESTRICT;

ALTER TABLE mentor_topics 
    ADD CONSTRAINT fk_mentor_topics_profile 
    FOREIGN KEY (mentor_profile_id) REFERENCES mentor_profiles(id) ON DELETE CASCADE;

ALTER TABLE mentor_payout_accounts 
    ADD CONSTRAINT fk_mentor_payout_accounts_profile 
    FOREIGN KEY (mentor_profile_id) REFERENCES mentor_profiles(id) ON DELETE CASCADE;

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX idx_user_terms_acceptances_user_id ON user_terms_acceptances (user_id);
CREATE INDEX idx_user_terms_acceptances_lookup ON user_terms_acceptances (user_id, terms_version);
CREATE INDEX idx_mentor_profiles_user_id ON mentor_profiles(user_id);
CREATE INDEX idx_mentor_profiles_status ON mentor_profiles(mentor_status);
CREATE INDEX idx_mentor_supported_fields_profile_id ON mentor_supported_fields(mentor_profile_id);
CREATE INDEX idx_mentor_supported_fields_industry_id ON mentor_supported_fields(industry_id);
CREATE INDEX idx_mentor_topics_profile_id ON mentor_topics(mentor_profile_id);
