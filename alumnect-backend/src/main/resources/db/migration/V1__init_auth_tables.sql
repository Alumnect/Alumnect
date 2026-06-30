-- =====================================================================
-- AlumNect (ACCP) — PostgreSQL schema v2 (progressive part 1: auth & user)
-- =====================================================================

-- 1) TABLES -----------------------------------------------------------

-- majors: Catalog of academic majors.
CREATE TABLE majors (
    id    BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code  VARCHAR(20)   NOT NULL UNIQUE,
    name  VARCHAR(150)  NOT NULL
);

-- roles: Catalog of user roles (one role per user at a time).
CREATE TABLE roles (
    id    BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name  VARCHAR(20)   NOT NULL UNIQUE
);

-- users: Identity & authentication. Every other table references users(id).
CREATE TABLE users (
    id              BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email           VARCHAR(255)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255),
    role_id         BIGINT        NOT NULL,
    account_status  VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    is_account_verified  BOOLEAN   NOT NULL DEFAULT false,
    email_verified  BOOLEAN       NOT NULL DEFAULT false,
    auth_provider   VARCHAR(20)   NOT NULL DEFAULT 'LOCAL',
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_users_account_status CHECK (account_status IN ('PENDING', 'ACTIVE', 'LOCKED', 'WAITING_APPROVAL')),
    CONSTRAINT ck_users_auth_provider CHECK (auth_provider IN ('LOCAL', 'GOOGLE'))
);

-- user_profiles: Public-facing profile (1-1 with users).
CREATE TABLE user_profiles (
    user_id           BIGINT        PRIMARY KEY,
    full_name         VARCHAR(150)  NOT NULL,
    avatar_url        VARCHAR(500),
    phone             VARCHAR(20),
    major_id          BIGINT,
    cohort            INTEGER,
    student_code      VARCHAR(20),
    headline          VARCHAR(160),
    biography         TEXT,
    current_position  VARCHAR(120),
    current_company   VARCHAR(150),
    city              VARCHAR(120),
    latitude          NUMERIC(9,6),
    longitude         NUMERIC(9,6),
    website_url       VARCHAR(255),
    linkedin_url      VARCHAR(255),
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- user_settings: Per-user preferences (1-1 with users).
CREATE TABLE user_settings (
    user_id     BIGINT       PRIMARY KEY,
    theme       VARCHAR(20)  NOT NULL DEFAULT 'SYSTEM',
    language    VARCHAR(10)  NOT NULL DEFAULT 'vi',
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_user_settings_theme CHECK (theme IN ('LIGHT', 'DARK', 'SYSTEM'))
);

-- verification_tokens: One-time tokens for email verification and password reset.
CREATE TABLE verification_tokens (
    id               BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          BIGINT        NOT NULL,
    type             VARCHAR(20)   NOT NULL,
    token            VARCHAR(120)  NOT NULL UNIQUE,
    expires_at       TIMESTAMPTZ   NOT NULL,
    used             BOOLEAN       NOT NULL DEFAULT false,
    failed_attempts  INTEGER       NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_verification_tokens_type CHECK (type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET'))
);

-- verification_requests: Alumni verification requests reviewed by admins.
CREATE TABLE verification_requests (
    id               BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id          BIGINT        NOT NULL,
    graduation_year  INTEGER       NOT NULL,
    major_id         BIGINT,
    proof_url        VARCHAR(500),
    note             VARCHAR(500),
    status           VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    reviewed_by      BIGINT,
    review_note      VARCHAR(500),
    reviewed_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_verification_requests_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- 2) SEED DATA FOR LOOKUP TABLES --------------------------------------

INSERT INTO roles (name) VALUES ('STUDENT'), ('ALUMNI'), ('ADMIN');

INSERT INTO majors (code, name) VALUES 
-- Khối ngành Công nghệ thông tin & Kỹ thuật
('SE', 'Kỹ thuật phần mềm'),
('AI', 'Trí tuệ nhân tạo'),
('ADS', 'Khoa học dữ liệu ứng dụng'),
('IS', 'An toàn thông tin'),
('SC', 'Thiết kế vi mạch bán dẫn'),
('DAT', 'Công nghệ ô tô số'),
('SYS', 'Hệ thống thông tin'),
('GD', 'Thiết kế đồ hoạ và mỹ thuật số'),
('RAI', 'Robot và Trí tuệ nhân tạo (Định hướng UAV và Humanoid)'),
('CS', 'Khoa học máy tính'),

-- Ngành Công nghệ truyền thông
('MC', 'Truyền thông đa phương tiện'),
('PR', 'Quan hệ công chúng'),
('IMC', 'Truyền thông Marketing tích hợp'),
('BC', 'Truyền thông thương hiệu'),

-- Khối ngành Ngôn ngữ
('E', 'Ngôn ngữ Anh'),
('BE', 'Tiếng Anh thương mại'),
('K', 'Ngôn ngữ Hàn Quốc'),
('BK', 'Tiếng Hàn thương mại'),
('C', 'Ngôn ngữ Trung Quốc'),
('BTC', 'Tiếng Trung thương mại'),

-- Ngành Luật
('LAW', 'Luật'),
('EL', 'Luật kinh tế'),

-- Ngành Quản trị kinh doanh
('MKT', 'Marketing'),
('IB', 'Kinh doanh quốc tế'),
('EC', 'Thương mại điện tử'),
('BA', 'Quản trị kinh doanh'),
('EEM', 'Quản trị giải trí và sự kiện'),
('CXM', 'Quản trị trải nghiệm khách hàng'),
('PM', 'Quản trị thu mua'),
('HM', 'Quản trị khách sạn'),
('TTM', 'Quản trị dịch vụ du lịch và lữ hành'),
('BAN', 'Phân tích kinh doanh (Business Analytics)'),
('LSC', 'Logistics và Quản lý chuỗi cung ứng toàn cầu'),
('FT', 'Công nghệ tài chính (Fintech)'),
('CF', 'Tài chính doanh nghiệp'),
('SF', 'Tài chính thông minh'),
('FB', 'Tài chính ngân hàng');

-- 3) FOREIGN KEYS -----------------------------------------------------

ALTER TABLE users ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT;
ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_profiles ADD CONSTRAINT fk_user_profiles_major_id FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE SET NULL;
ALTER TABLE user_settings ADD CONSTRAINT fk_user_settings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE verification_tokens ADD CONSTRAINT fk_verification_tokens_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE verification_requests ADD CONSTRAINT fk_verification_requests_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE verification_requests ADD CONSTRAINT fk_verification_requests_major_id FOREIGN KEY (major_id) REFERENCES majors(id) ON DELETE SET NULL;
ALTER TABLE verification_requests ADD CONSTRAINT fk_verification_requests_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- 4) INDEXES ----------------------------------------------------------

CREATE INDEX idx_user_profiles_major_id ON user_profiles (major_id);
CREATE INDEX idx_verification_tokens_user_id_type ON verification_tokens (user_id, type);
CREATE INDEX idx_users_role_id ON users (role_id);
CREATE INDEX idx_users_account_status ON users (account_status);
CREATE INDEX idx_user_profiles_latitude_longitude ON user_profiles (latitude, longitude);
