-- ==============================================================================
-- AlumNect Database Migration - Version 23
-- Feature: Flow 4 - Mentoring Work Log Clarification & Feedback History (UC108)
-- Bao gồm: Bảng phản hồi (Feedback/Clarification), bảng lịch sử phiên bản (Revisions),
--          bổ sung confirmed_by và revision_number cho mentoring_work_logs
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. mentoring_work_logs: Bổ sung confirmed_by và revision_number
-- ------------------------------------------------------------------------------
ALTER TABLE mentoring_work_logs
    ADD COLUMN IF NOT EXISTS confirmed_by BIGINT,
    ADD COLUMN IF NOT EXISTS revision_number INT NOT NULL DEFAULT 1;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_mentoring_work_logs_confirmed_by'
    ) THEN
        ALTER TABLE mentoring_work_logs
            ADD CONSTRAINT fk_mentoring_work_logs_confirmed_by
            FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_mentoring_work_logs_confirmed_by ON mentoring_work_logs (confirmed_by);

-- ------------------------------------------------------------------------------
-- 2. mentoring_work_log_feedbacks: Lưu lịch sử phản hồi/yêu cầu làm rõ của Student (UC108)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentoring_work_log_feedbacks (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    work_log_id         BIGINT NOT NULL,
    student_id          BIGINT NOT NULL,
    action              VARCHAR(50) NOT NULL, -- 'CONFIRMED', 'CLARIFICATION_REQUESTED'
    reason              TEXT,
    revision_number     INT NOT NULL DEFAULT 1,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_work_log_feedbacks_work_log FOREIGN KEY (work_log_id) REFERENCES mentoring_work_logs(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_log_feedbacks_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_work_log_feedbacks_work_log_id ON mentoring_work_log_feedbacks (work_log_id);
CREATE INDEX IF NOT EXISTS idx_work_log_feedbacks_student_id ON mentoring_work_log_feedbacks (student_id);
CREATE INDEX IF NOT EXISTS idx_work_log_feedbacks_created_at ON mentoring_work_log_feedbacks (created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. mentoring_work_log_revisions: Lưu snapshot bảo toàn bằng chứng khi Mentor resubmit (UC108)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentoring_work_log_revisions (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    work_log_id         BIGINT NOT NULL,
    revision_number     INT NOT NULL DEFAULT 1,
    mentor_id           BIGINT NOT NULL,
    log_date            DATE NOT NULL,
    description         TEXT NOT NULL,
    work_completed      TEXT NOT NULL,
    result              TEXT NOT NULL,
    next_action         TEXT,
    attachments_summary TEXT,
    student_feedback    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_work_log_revisions_work_log FOREIGN KEY (work_log_id) REFERENCES mentoring_work_logs(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_log_revisions_mentor FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_work_log_revisions_work_log_id ON mentoring_work_log_revisions (work_log_id);
CREATE INDEX IF NOT EXISTS idx_work_log_revisions_revision_no ON mentoring_work_log_revisions (work_log_id, revision_number);
