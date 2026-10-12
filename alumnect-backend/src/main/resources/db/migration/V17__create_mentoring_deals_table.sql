-- ==============================================================================
-- AlumNect Database Migration - Version 17
-- Feature: Flow 3 - Mentoring Deal & Payment (UC104 & UC105)
-- Bao gồm: Thỏa thuận Deal, Snapshots, Kích hoạt Task và Thanh toán VietQR PayOS
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- 1. Bảng mentoring_deals: Quản lý thỏa thuận công việc, giá và điều kiện giữa Student & Mentor
CREATE TABLE mentoring_deals (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id           BIGINT NOT NULL,
    mentor_id            BIGINT NOT NULL,
    conversation_id      BIGINT,
    request_id           BIGINT,
    ticket_type          VARCHAR(20) NOT NULL DEFAULT 'DEAL',
    proposal_source      VARCHAR(30) NOT NULL DEFAULT 'RENEGOTIATION',
    task_scope           TEXT NOT NULL,
    agreed_price         NUMERIC(12, 2) NOT NULL,
    deadline             TIMESTAMPTZ NOT NULL,
    working_mode         VARCHAR(20) NOT NULL,
    participation_type   VARCHAR(20) NOT NULL,
    task_type            VARCHAR(50) NOT NULL,
    expected_result      TEXT NOT NULL,
    version              INTEGER NOT NULL DEFAULT 1,
    student_confirmed    BOOLEAN NOT NULL DEFAULT FALSE,
    mentor_confirmed     BOOLEAN NOT NULL DEFAULT FALSE,
    student_confirmed_at TIMESTAMPTZ,
    mentor_confirmed_at  TIMESTAMPTZ,
    status               VARCHAR(30) NOT NULL DEFAULT 'PROPOSED',
    is_locked            BOOLEAN NOT NULL DEFAULT FALSE,
    locked_at            TIMESTAMPTZ,
    is_paid              BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at              TIMESTAMPTZ,
    created_by           BIGINT NOT NULL,
    updated_by           BIGINT NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentoring_deals_working_mode CHECK (working_mode IN ('ONLINE', 'OFFLINE', 'BOTH')),
    CONSTRAINT ck_mentoring_deals_participation_type CHECK (participation_type IN ('INDIVIDUAL', 'GROUP')),
    CONSTRAINT ck_mentoring_deals_status CHECK (status IN ('PROPOSED', 'STUDENT_CONFIRMED', 'MENTOR_CONFIRMED', 'DEAL_CONFIRMED', 'SUPERSEDED', 'CANCELLED', 'REJECTED')),
    CONSTRAINT ck_mentoring_deals_proposal_source CHECK (proposal_source IN ('REQUEST_ACCEPTANCE', 'RENEGOTIATION')),
    CONSTRAINT ck_mentoring_deals_price CHECK (agreed_price >= 0)
);

-- 2. Bảng mentoring_deal_snapshots: Lưu lịch sử từng phiên bản/bản nháp Snapshot của Deal
CREATE TABLE mentoring_deal_snapshots (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    deal_id              BIGINT NOT NULL,
    version              INTEGER NOT NULL,
    ticket_type          VARCHAR(20) NOT NULL DEFAULT 'DEAL',
    proposal_source      VARCHAR(30) NOT NULL DEFAULT 'RENEGOTIATION',
    task_scope           TEXT NOT NULL,
    agreed_price         NUMERIC(12, 2) NOT NULL,
    deadline             TIMESTAMPTZ NOT NULL,
    working_mode         VARCHAR(20) NOT NULL,
    participation_type   VARCHAR(20) NOT NULL,
    task_type            VARCHAR(50) NOT NULL,
    expected_result      TEXT NOT NULL,
    modified_by          BIGINT NOT NULL,
    change_note          VARCHAR(255),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_deal_snapshots_working_mode CHECK (working_mode IN ('ONLINE', 'OFFLINE', 'BOTH')),
    CONSTRAINT ck_deal_snapshots_participation_type CHECK (participation_type IN ('INDIVIDUAL', 'GROUP')),
    CONSTRAINT ck_deal_snapshots_price CHECK (agreed_price >= 0),
    CONSTRAINT uq_deal_snapshots_deal_version UNIQUE (deal_id, version)
);

-- 3. Bảng mentoring_tasks: Lưu trữ Task Mentoring chính thức được kích hoạt sau khi thanh toán thành công (UC105)
CREATE TABLE mentoring_tasks (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    deal_id             BIGINT NOT NULL UNIQUE,
    student_id          BIGINT NOT NULL,
    mentor_id           BIGINT NOT NULL,
    conversation_id     BIGINT,
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

-- 4. Bảng mentoring_task_payments: Lưu vết giao dịch thanh toán Task qua cổng PayOS (Escrow/Payment tracking - UC105)
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

-- ==============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ==============================================================================
ALTER TABLE mentoring_deals 
    ADD CONSTRAINT fk_mentoring_deals_student_id 
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE mentoring_deals 
    ADD CONSTRAINT fk_mentoring_deals_mentor_id 
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE mentoring_deals 
    ADD CONSTRAINT fk_mentoring_deals_conversation_id 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

ALTER TABLE mentoring_deals 
    ADD CONSTRAINT fk_mentoring_deals_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_deals 
    ADD CONSTRAINT fk_mentoring_deals_updated_by 
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_deal_snapshots 
    ADD CONSTRAINT fk_deal_snapshots_deal_id 
    FOREIGN KEY (deal_id) REFERENCES mentoring_deals(id) ON DELETE CASCADE;

ALTER TABLE mentoring_deal_snapshots 
    ADD CONSTRAINT fk_deal_snapshots_modified_by 
    FOREIGN KEY (modified_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_tasks 
    ADD CONSTRAINT fk_mentoring_tasks_deal 
    FOREIGN KEY (deal_id) REFERENCES mentoring_deals(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_tasks 
    ADD CONSTRAINT fk_mentoring_tasks_student 
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_tasks 
    ADD CONSTRAINT fk_mentoring_tasks_mentor 
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_tasks 
    ADD CONSTRAINT fk_mentoring_tasks_conversation 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

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
CREATE INDEX idx_mentoring_deals_student_id ON mentoring_deals (student_id);
CREATE INDEX idx_mentoring_deals_mentor_id ON mentoring_deals (mentor_id);
CREATE INDEX idx_mentoring_deals_conversation_id ON mentoring_deals (conversation_id);
CREATE INDEX idx_mentoring_deals_request_id ON mentoring_deals (request_id);
CREATE INDEX idx_mentoring_deals_status ON mentoring_deals (status);

CREATE INDEX idx_deal_snapshots_deal_id ON mentoring_deal_snapshots (deal_id);

CREATE INDEX idx_mentoring_tasks_deal_id ON mentoring_tasks (deal_id);
CREATE INDEX idx_mentoring_tasks_student_id ON mentoring_tasks (student_id);
CREATE INDEX idx_mentoring_tasks_mentor_id ON mentoring_tasks (mentor_id);
CREATE INDEX idx_mentoring_tasks_conversation_id ON mentoring_tasks (conversation_id);
CREATE INDEX idx_mentoring_tasks_status ON mentoring_tasks (status);

CREATE INDEX idx_task_payments_deal_id ON mentoring_task_payments (deal_id);
CREATE INDEX idx_task_payments_student_id ON mentoring_task_payments (student_id);
CREATE INDEX idx_task_payments_order_code ON mentoring_task_payments (order_code);
CREATE INDEX idx_task_payments_status ON mentoring_task_payments (payment_status);
