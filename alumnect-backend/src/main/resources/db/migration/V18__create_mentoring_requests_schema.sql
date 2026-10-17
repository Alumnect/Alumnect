-- ==============================================================================
-- AlumNect Database Migration - Version 18
-- Feature: UC100 - Tạo yêu cầu Mentoring chung & Phân phối nội bộ
-- (Create Mentoring Request & Internal Distribution)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- 1. Bảng mentoring_requests: Lưu trữ thông tin yêu cầu Mentoring chung của sinh viên (UC100)
CREATE TABLE mentoring_requests (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id          BIGINT NOT NULL,
    industry_id         BIGINT NOT NULL,
    title               VARCHAR(200) NOT NULL,
    description         TEXT NOT NULL,
    budget_min          NUMERIC(12, 2),
    budget_max          NUMERIC(12, 2),
    working_mode        VARCHAR(20) NOT NULL,
    participation_type  VARCHAR(20) NOT NULL,
    task_type           VARCHAR(50) NOT NULL,
    expected_deadline   TIMESTAMPTZ,
    status              VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    matched_count       INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentoring_requests_working_mode CHECK (working_mode IN ('ONLINE', 'OFFLINE', 'BOTH')),
    CONSTRAINT ck_mentoring_requests_participation_type CHECK (participation_type IN ('INDIVIDUAL', 'GROUP', 'BOTH')),
    CONSTRAINT ck_mentoring_requests_task_type CHECK (task_type IN ('CAREER_ORIENTATION', 'RESUME_REVIEW', 'MOCK_INTERVIEW', 'TECHNICAL_CONSULTING', 'CAPSTONE_ADVICE', 'OTHER')),
    CONSTRAINT ck_mentoring_requests_status CHECK (status IN ('OPEN', 'MATCHED', 'CLOSED', 'CANCELLED')),
    CONSTRAINT ck_mentoring_requests_budget_non_negative CHECK ((budget_min IS NULL OR budget_min >= 0) AND (budget_max IS NULL OR budget_max >= 0)),
    CONSTRAINT ck_mentoring_requests_budget_range CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_max >= budget_min),
    CONSTRAINT ck_mentoring_requests_matched_count CHECK (matched_count >= 0)
);

-- 2. Bảng mentoring_request_attachments: Lưu trữ tệp tin đính kèm cho yêu cầu Mentoring (UC100)
CREATE TABLE mentoring_request_attachments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id          BIGINT NOT NULL,
    file_name           VARCHAR(255) NOT NULL,
    file_url            VARCHAR(500) NOT NULL,
    file_size           BIGINT NOT NULL,
    file_type           VARCHAR(100),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentoring_request_attachments_size CHECK (file_size > 0 AND file_size < 10485760)
);

-- 3. Bảng mentoring_request_distributions: Lưu liên kết phân phối yêu cầu tới các Mentor phù hợp (Internal Matching & Distribution)
CREATE TABLE mentoring_request_distributions (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id          BIGINT NOT NULL,
    mentor_profile_id   BIGINT NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    distributed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentoring_request_distributions_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
    CONSTRAINT uq_mentoring_request_distributions UNIQUE (request_id, mentor_profile_id)
);

-- ==============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ==============================================================================
ALTER TABLE mentoring_requests
    ADD CONSTRAINT fk_mentoring_requests_student
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE mentoring_requests
    ADD CONSTRAINT fk_mentoring_requests_industry
    FOREIGN KEY (industry_id) REFERENCES industries(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_request_attachments
    ADD CONSTRAINT fk_mentoring_request_attachments_request
    FOREIGN KEY (request_id) REFERENCES mentoring_requests(id) ON DELETE CASCADE;

ALTER TABLE mentoring_request_distributions
    ADD CONSTRAINT fk_mentoring_request_distributions_request
    FOREIGN KEY (request_id) REFERENCES mentoring_requests(id) ON DELETE CASCADE;

ALTER TABLE mentoring_request_distributions
    ADD CONSTRAINT fk_mentoring_request_distributions_mentor
    FOREIGN KEY (mentor_profile_id) REFERENCES mentor_profiles(id) ON DELETE CASCADE;

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX idx_mentoring_requests_student_id ON mentoring_requests (student_id);
CREATE INDEX idx_mentoring_requests_industry_id ON mentoring_requests (industry_id);
CREATE INDEX idx_mentoring_requests_status ON mentoring_requests (status);
CREATE INDEX idx_mentoring_request_attachments_request_id ON mentoring_request_attachments (request_id);
CREATE INDEX idx_mentoring_request_distributions_mentor ON mentoring_request_distributions (mentor_profile_id, status);
CREATE INDEX idx_mentoring_request_distributions_request ON mentoring_request_distributions (request_id);
