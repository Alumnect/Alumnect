-- ==============================================================================
-- AlumNect Database Migration - Version 26
-- Feature: UC110 - Gửi & xác nhận hoàn thành Task
--          - Bảng mentoring_task_completions: Lưu vết các lần nộp kết quả nghiệm thu Task
--          - Đảm bảo ràng buộc ck_mentoring_tasks_status hỗ trợ đầy đủ các trạng thái
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Bảng mentoring_task_completions (Biên bản nộp nghiệm thu Task)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentoring_task_completions (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task_id             BIGINT NOT NULL,
    conversation_id     BIGINT,
    submitted_by        BIGINT NOT NULL,
    final_summary       TEXT NOT NULL,
    deliverables        TEXT,
    attachment_urls     TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    responded_by        BIGINT,
    responded_at        TIMESTAMPTZ,
    feedback_note       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_task_completions_status CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'SUPERSEDED'))
);

-- ------------------------------------------------------------------------------
-- 2. Foreign Key Constraints
-- ------------------------------------------------------------------------------
ALTER TABLE mentoring_task_completions
    ADD CONSTRAINT fk_task_completions_task
    FOREIGN KEY (task_id) REFERENCES mentoring_tasks(id) ON DELETE CASCADE;

ALTER TABLE mentoring_task_completions
    ADD CONSTRAINT fk_task_completions_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

ALTER TABLE mentoring_task_completions
    ADD CONSTRAINT fk_task_completions_submitted_by
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE mentoring_task_completions
    ADD CONSTRAINT fk_task_completions_responded_by
    FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 3. Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON mentoring_task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_status ON mentoring_task_completions(status);
CREATE INDEX IF NOT EXISTS idx_task_completions_submitted_by ON mentoring_task_completions(submitted_by);

-- ------------------------------------------------------------------------------
-- 4. Đảm bảo trạng thái Task trong bảng mentoring_tasks hỗ trợ đầy đủ vòng đời
-- ------------------------------------------------------------------------------
ALTER TABLE mentoring_tasks DROP CONSTRAINT IF EXISTS ck_mentoring_tasks_status;
ALTER TABLE mentoring_tasks ADD CONSTRAINT ck_mentoring_tasks_status
    CHECK (status IN ('PREPARATION', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CANCELLED', 'DISPUTED'));
