-- ==============================================================================
-- AlumNect Database Migration - Version 18
-- Feature: Flow 3 - Deal và thanh toán: UC105 - Thanh toán Mentoring Task
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- 1. Bảng mentoring_tasks: Lưu trữ Task Mentoring chính thức được kích hoạt sau khi thanh toán thành công
CREATE TABLE mentoring_tasks (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    deal_id             BIGINT NOT NULL UNIQUE,
    student_id          BIGINT NOT NULL,
    mentor_id           BIGINT NOT NULL,
    task_title          VARCHAR(255) NOT NULL,
    task_scope          TEXT NOT NULL,
    agreed_price        NUMERIC(12, 2) NOT NULL,
    deadline            TIMESTAMPTZ NOT NULL,
    working_mode        VARCHAR(20) NOT NULL,
    participation_type  VARCHAR(20) NOT NULL,
    task_type           VARCHAR(50) NOT NULL,
    expected_result     TEXT NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PREPARATION',
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentoring_tasks_status CHECK (status IN ('PREPARATION', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT ck_mentoring_tasks_working_mode CHECK (working_mode IN ('ONLINE', 'OFFLINE', 'BOTH')),
    CONSTRAINT ck_mentoring_tasks_participation_type CHECK (participation_type IN ('INDIVIDUAL', 'GROUP')),
    CONSTRAINT ck_mentoring_tasks_task_type CHECK (task_type IN ('CONSULTATION', 'ASSIGNMENT_GUIDANCE', 'PROJECT_MENTORING', 'RESUME_REVIEW', 'MOCK_INTERVIEW', 'SKILL_TRAINING', 'OTHER')),
    CONSTRAINT ck_mentoring_tasks_agreed_price CHECK (agreed_price >= 0)
);

-- 2. Bảng mentoring_task_payments: Lưu vết giao dịch thanh toán Task qua cổng PayOS (Escrow/Payment tracking)
CREATE TABLE mentoring_task_payments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    deal_id             BIGINT NOT NULL,
    student_id          BIGINT NOT NULL,
    task_id             BIGINT,
    order_code          BIGINT NOT NULL UNIQUE,
    amount              NUMERIC(12, 2) NOT NULL,
    payment_status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method      VARCHAR(50) NOT NULL DEFAULT 'PAYOS',
    payment_reference   VARCHAR(100),
    description         VARCHAR(255),
    qr_code_url         TEXT,
    checkout_url        TEXT,
    account_number      VARCHAR(50),
    account_name        VARCHAR(150),
    bin                 VARCHAR(20),
    payment_expires_at  TIMESTAMPTZ NOT NULL,
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_task_payments_status CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED')),
    CONSTRAINT ck_task_payments_amount CHECK (amount >= 0)
);

-- 3. Bổ sung các cột theo dõi trạng thái thanh toán vào bảng mentoring_deals
ALTER TABLE mentoring_deals 
    ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE mentoring_deals 
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- ==============================================================================
-- FOREIGN KEY CONSTRAINTS (Khai báo ở cuối file, không tạo FK vòng)
-- ==============================================================================
ALTER TABLE mentoring_tasks 
    ADD CONSTRAINT fk_mentoring_tasks_deal 
    FOREIGN KEY (deal_id) REFERENCES mentoring_deals(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_tasks 
    ADD CONSTRAINT fk_mentoring_tasks_student 
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_tasks 
    ADD CONSTRAINT fk_mentoring_tasks_mentor 
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_task_payments 
    ADD CONSTRAINT fk_task_payments_deal 
    FOREIGN KEY (deal_id) REFERENCES mentoring_deals(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_task_payments 
    ADD CONSTRAINT fk_task_payments_student 
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_task_payments 
    ADD CONSTRAINT fk_task_payments_task 
    FOREIGN KEY (task_id) REFERENCES mentoring_tasks(id) ON DELETE SET NULL;

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX idx_mentoring_tasks_deal_id ON mentoring_tasks (deal_id);
CREATE INDEX idx_mentoring_tasks_student_id ON mentoring_tasks (student_id);
CREATE INDEX idx_mentoring_tasks_mentor_id ON mentoring_tasks (mentor_id);
CREATE INDEX idx_mentoring_tasks_status ON mentoring_tasks (status);

CREATE INDEX idx_task_payments_deal_id ON mentoring_task_payments (deal_id);
CREATE INDEX idx_task_payments_student_id ON mentoring_task_payments (student_id);
CREATE INDEX idx_task_payments_order_code ON mentoring_task_payments (order_code);
CREATE INDEX idx_task_payments_status ON mentoring_task_payments (payment_status);
