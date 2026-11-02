-- ==============================================================================
-- AlumNect Database Migration - Version 27
-- Feature: UC111 - Gửi Settlement Ticket đã thỏa thuận
--          - Bảng mentoring_dispute_tickets: Lưu trữ các Ticket gửi Admin xử lý
--            (Loại SETTLEMENT - Thỏa thuận dừng Task đã đồng thuận & DISPUTE - Tranh chấp)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Bảng mentoring_dispute_tickets
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentoring_dispute_tickets (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_code             VARCHAR(50) NOT NULL UNIQUE,
    ticket_type             VARCHAR(30) NOT NULL,
    task_id                 BIGINT NOT NULL,
    conversation_id         BIGINT,
    settlement_proposal_id  BIGINT,
    created_by              BIGINT NOT NULL,
    student_id              BIGINT NOT NULL,
    mentor_id               BIGINT NOT NULL,
    title                   VARCHAR(255) NOT NULL,
    description             TEXT NOT NULL,
    mentor_amount           NUMERIC(12, 2) NOT NULL DEFAULT 0,
    student_refund          NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount            NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status                  VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    handled_by              BIGINT,
    accepted_at             TIMESTAMPTZ,
    resolved_at             TIMESTAMPTZ,
    resolution_note         TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_dispute_tickets_type CHECK (ticket_type IN ('SETTLEMENT', 'DISPUTE')),
    CONSTRAINT ck_dispute_tickets_status CHECK (status IN ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED', 'CANCELLED')),
    CONSTRAINT ck_dispute_tickets_amounts CHECK (mentor_amount >= 0 AND student_refund >= 0 AND total_amount >= 0)
);

-- ------------------------------------------------------------------------------
-- 2. Foreign Key Constraints
-- ------------------------------------------------------------------------------
ALTER TABLE mentoring_dispute_tickets
    ADD CONSTRAINT fk_dispute_tickets_task
    FOREIGN KEY (task_id) REFERENCES mentoring_tasks(id) ON DELETE CASCADE;

ALTER TABLE mentoring_dispute_tickets
    ADD CONSTRAINT fk_dispute_tickets_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

ALTER TABLE mentoring_dispute_tickets
    ADD CONSTRAINT fk_dispute_tickets_proposal
    FOREIGN KEY (settlement_proposal_id) REFERENCES mentoring_task_settlement_proposals(id) ON DELETE SET NULL;

ALTER TABLE mentoring_dispute_tickets
    ADD CONSTRAINT fk_dispute_tickets_created_by
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_dispute_tickets
    ADD CONSTRAINT fk_dispute_tickets_student
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_dispute_tickets
    ADD CONSTRAINT fk_dispute_tickets_mentor
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_dispute_tickets
    ADD CONSTRAINT fk_dispute_tickets_handled_by
    FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 3. Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_dispute_tickets_task_id ON mentoring_dispute_tickets(task_id);
CREATE INDEX IF NOT EXISTS idx_dispute_tickets_type ON mentoring_dispute_tickets(ticket_type);
CREATE INDEX IF NOT EXISTS idx_dispute_tickets_status ON mentoring_dispute_tickets(status);
CREATE INDEX IF NOT EXISTS idx_dispute_tickets_handled_by ON mentoring_dispute_tickets(handled_by);
CREATE INDEX IF NOT EXISTS idx_dispute_tickets_created_by ON mentoring_dispute_tickets(created_by);
