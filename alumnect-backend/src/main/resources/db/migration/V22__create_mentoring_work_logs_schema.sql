-- ==============================================================================
-- AlumNect Database Migration - Version 22
-- Feature: Flow 4 - Mentoring Task Management & Work Log (UC106 & UC107)
-- Bao gồm: Bảng nhật ký công việc (Work Log), đính kèm minh chứng (Attachments),
--          bổ sung trạng thái DISPUTED cho Task và loại thông báo Mentoring
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. notifications: Bổ sung loại thông báo MENTORING_WORK_LOG và MENTORING_TASK
-- ------------------------------------------------------------------------------
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS ck_notifications_type;
ALTER TABLE notifications
    ADD CONSTRAINT ck_notifications_type CHECK (type IN (
        'POST_LIKE', 'POST_COMMENT', 'USER_FOLLOW', 'FORUM_ANSWER',
        'REPORT_RESOLVED', 'WELCOME', 'SYSTEM_BROADCAST',
        'MENTORING_WORK_LOG', 'MENTORING_TASK'
    ));

-- ------------------------------------------------------------------------------
-- 2. mentoring_tasks: Mở rộng trạng thái hỗ trợ DISPUTED (khi có tranh chấp nghiệp vụ)
-- ------------------------------------------------------------------------------
ALTER TABLE mentoring_tasks DROP CONSTRAINT IF EXISTS ck_mentoring_tasks_status;
ALTER TABLE mentoring_tasks
    ADD CONSTRAINT ck_mentoring_tasks_status CHECK (status IN (
        'PREPARATION', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CANCELLED', 'DISPUTED'
    ));

-- ------------------------------------------------------------------------------
-- 3. mentoring_work_logs: Lưu trữ nhật ký công việc của Mentor theo từng Task (UC107)
-- ------------------------------------------------------------------------------
CREATE TABLE mentoring_work_logs (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task_id             BIGINT NOT NULL,
    mentor_id           BIGINT NOT NULL,
    log_date            DATE NOT NULL,
    description         TEXT NOT NULL,
    work_completed      TEXT NOT NULL,
    result              TEXT NOT NULL,
    next_action         TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING_CONFIRMATION',
    student_feedback    TEXT,
    confirmed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentoring_work_logs_status CHECK (status IN ('PENDING_CONFIRMATION', 'CONFIRMED', 'REJECTED'))
);

-- ------------------------------------------------------------------------------
-- 4. mentoring_work_log_attachments: Tệp tin/minh chứng đính kèm nhật ký công việc
-- ------------------------------------------------------------------------------
CREATE TABLE mentoring_work_log_attachments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    work_log_id         BIGINT NOT NULL,
    file_url            VARCHAR(500) NOT NULL,
    file_name           VARCHAR(255) NOT NULL,
    file_size           BIGINT,
    media_type          VARCHAR(20) NOT NULL DEFAULT 'FILE',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_work_log_attachments_media_type CHECK (media_type IN ('IMAGE', 'VIDEO', 'FILE'))
);

-- ==============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ==============================================================================
ALTER TABLE mentoring_work_logs
    ADD CONSTRAINT fk_mentoring_work_logs_task
    FOREIGN KEY (task_id) REFERENCES mentoring_tasks(id) ON DELETE CASCADE;

ALTER TABLE mentoring_work_logs
    ADD CONSTRAINT fk_mentoring_work_logs_mentor
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_work_log_attachments
    ADD CONSTRAINT fk_work_log_attachments_work_log
    FOREIGN KEY (work_log_id) REFERENCES mentoring_work_logs(id) ON DELETE CASCADE;

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX idx_mentoring_work_logs_task_id ON mentoring_work_logs (task_id);
CREATE INDEX idx_mentoring_work_logs_mentor_id ON mentoring_work_logs (mentor_id);
CREATE INDEX idx_mentoring_work_logs_status ON mentoring_work_logs (status);
CREATE INDEX idx_mentoring_work_logs_log_date ON mentoring_work_logs (log_date DESC);
CREATE INDEX idx_mentoring_work_logs_created_at ON mentoring_work_logs (created_at DESC);
CREATE INDEX idx_work_log_attachments_log_id ON mentoring_work_log_attachments (work_log_id);
