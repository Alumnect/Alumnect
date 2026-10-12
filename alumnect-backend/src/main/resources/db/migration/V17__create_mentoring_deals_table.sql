-- ==============================================================================
-- AlumNect Database Migration - Version 17
-- Feature: Flow 3 - Mentoring Deal & Payment (UC104 - Thỏa thuận & xác nhận Mentoring Deal)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- 1. Bảng mentoring_deals: Quản lý thỏa thuận công việc, giá và điều kiện giữa Student & Mentor
CREATE TABLE mentoring_deals (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id           BIGINT NOT NULL,
    mentor_id            BIGINT NOT NULL,
    conversation_id      BIGINT,
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
    created_by           BIGINT NOT NULL,
    updated_by           BIGINT NOT NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentoring_deals_working_mode CHECK (working_mode IN ('ONLINE', 'OFFLINE', 'BOTH')),
    CONSTRAINT ck_mentoring_deals_participation_type CHECK (participation_type IN ('INDIVIDUAL', 'GROUP')),
    CONSTRAINT ck_mentoring_deals_status CHECK (status IN ('PROPOSED', 'STUDENT_CONFIRMED', 'MENTOR_CONFIRMED', 'DEAL_CONFIRMED', 'CANCELLED')),
    CONSTRAINT ck_mentoring_deals_price CHECK (agreed_price >= 0)
);

-- 2. Bảng mentoring_deal_snapshots: Lưu lịch sử từng phiên bản/bản nháp Snapshot của Deal
CREATE TABLE mentoring_deal_snapshots (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    deal_id              BIGINT NOT NULL,
    version              INTEGER NOT NULL,
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

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX idx_mentoring_deals_student_id ON mentoring_deals (student_id);
CREATE INDEX idx_mentoring_deals_mentor_id ON mentoring_deals (mentor_id);
CREATE INDEX idx_mentoring_deals_conversation_id ON mentoring_deals (conversation_id);
CREATE INDEX idx_mentoring_deals_status ON mentoring_deals (status);
CREATE INDEX idx_deal_snapshots_deal_id ON mentoring_deal_snapshots (deal_id);
