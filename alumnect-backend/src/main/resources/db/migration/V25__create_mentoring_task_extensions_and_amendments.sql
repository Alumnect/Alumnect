-- ==============================================================================
-- AlumNect Database Migration - Version 25
-- Feature: UC109 - Thỏa thuận gia hạn hoặc xử lý Task chưa hoàn thành
--          - Bảng mentoring_task_deadline_extensions: Thẻ Ticket gia hạn deadline
--          - Bảng mentoring_task_amendments: Thẻ Ticket điều chỉnh phạm vi/kết quả/tiền bổ sung
--          - Bảng mentoring_task_settlement_proposals: Thỏa thuận dừng Task và phân chia tiền
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Bảng mentoring_task_deadline_extensions (Deadline Extension Ticket)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentoring_task_deadline_extensions (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task_id             BIGINT NOT NULL,
    conversation_id     BIGINT,
    created_by          BIGINT NOT NULL,
    recipient_id        BIGINT NOT NULL,
    current_deadline    TIMESTAMPTZ NOT NULL,
    proposed_deadline   TIMESTAMPTZ NOT NULL,
    reason              TEXT NOT NULL,
    status              VARCHAR(30) NOT NULL,
    responded_by        BIGINT,
    responded_at        TIMESTAMPTZ,
    response_note       VARCHAR(500),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_task_deadline_extensions_status CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'SUPERSEDED')),
    CONSTRAINT ck_task_deadline_extensions_deadline CHECK (proposed_deadline > current_deadline)
);

CREATE INDEX IF NOT EXISTS idx_task_deadline_extensions_task_id ON mentoring_task_deadline_extensions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deadline_extensions_conversation_id ON mentoring_task_deadline_extensions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_task_deadline_extensions_status ON mentoring_task_deadline_extensions(status);

-- ------------------------------------------------------------------------------
-- 2. Bảng mentoring_task_amendments (Task Amendment Ticket)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentoring_task_amendments (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task_id                 BIGINT NOT NULL,
    conversation_id         BIGINT,
    created_by              BIGINT NOT NULL,
    recipient_id            BIGINT NOT NULL,
    version                 INT NOT NULL DEFAULT 1,
    previous_scope          TEXT,
    new_scope               TEXT,
    previous_expected_result TEXT,
    new_expected_result     TEXT,
    additional_amount       NUMERIC(12, 2) NOT NULL DEFAULT 0,
    previous_deadline       TIMESTAMPTZ,
    new_deadline            TIMESTAMPTZ,
    reason                  TEXT NOT NULL,
    status                  VARCHAR(30) NOT NULL,
    responded_by            BIGINT,
    responded_at            TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_task_amendments_status CHECK (status IN ('PENDING', 'AWAITING_TOPUP', 'APPLIED', 'REJECTED', 'SUPERSEDED', 'CANCELLED')),
    CONSTRAINT ck_task_amendments_amount CHECK (additional_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_task_amendments_task_id ON mentoring_task_amendments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_amendments_conversation_id ON mentoring_task_amendments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_task_amendments_status ON mentoring_task_amendments(status);

-- ------------------------------------------------------------------------------
-- 3. Bảng mentoring_task_settlement_proposals (Thỏa thuận dừng Task)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentoring_task_settlement_proposals (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    task_id             BIGINT NOT NULL,
    conversation_id     BIGINT,
    created_by          BIGINT NOT NULL,
    recipient_id        BIGINT NOT NULL,
    mentor_amount       NUMERIC(12, 2) NOT NULL,
    student_refund      NUMERIC(12, 2) NOT NULL,
    total_amount        NUMERIC(12, 2) NOT NULL,
    reason              TEXT NOT NULL,
    status              VARCHAR(30) NOT NULL,
    responded_by        BIGINT,
    responded_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_task_settlement_proposals_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'SUPERSEDED')),
    CONSTRAINT ck_task_settlement_proposals_mentor_amount CHECK (mentor_amount >= 0),
    CONSTRAINT ck_task_settlement_proposals_student_refund CHECK (student_refund >= 0),
    CONSTRAINT ck_task_settlement_proposals_total CHECK (mentor_amount + student_refund = total_amount)
);

CREATE INDEX IF NOT EXISTS idx_task_settlement_proposals_task_id ON mentoring_task_settlement_proposals(task_id);
CREATE INDEX IF NOT EXISTS idx_task_settlement_proposals_conversation_id ON mentoring_task_settlement_proposals(conversation_id);
CREATE INDEX IF NOT EXISTS idx_task_settlement_proposals_status ON mentoring_task_settlement_proposals(status);

-- ------------------------------------------------------------------------------
-- 4. Foreign Key Constraints
-- ------------------------------------------------------------------------------
ALTER TABLE mentoring_task_deadline_extensions
    ADD CONSTRAINT fk_task_deadline_extensions_task
    FOREIGN KEY (task_id) REFERENCES mentoring_tasks(id) ON DELETE CASCADE;

ALTER TABLE mentoring_task_deadline_extensions
    ADD CONSTRAINT fk_task_deadline_extensions_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

ALTER TABLE mentoring_task_deadline_extensions
    ADD CONSTRAINT fk_task_deadline_extensions_creator
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_task_deadline_extensions
    ADD CONSTRAINT fk_task_deadline_extensions_recipient
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_task_deadline_extensions
    ADD CONSTRAINT fk_task_deadline_extensions_responder
    FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL;

-- Amendments FKs
ALTER TABLE mentoring_task_amendments
    ADD CONSTRAINT fk_task_amendments_task
    FOREIGN KEY (task_id) REFERENCES mentoring_tasks(id) ON DELETE CASCADE;

ALTER TABLE mentoring_task_amendments
    ADD CONSTRAINT fk_task_amendments_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

ALTER TABLE mentoring_task_amendments
    ADD CONSTRAINT fk_task_amendments_creator
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_task_amendments
    ADD CONSTRAINT fk_task_amendments_recipient
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_task_amendments
    ADD CONSTRAINT fk_task_amendments_responder
    FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL;

-- Settlement Proposals FKs
ALTER TABLE mentoring_task_settlement_proposals
    ADD CONSTRAINT fk_task_settlement_proposals_task
    FOREIGN KEY (task_id) REFERENCES mentoring_tasks(id) ON DELETE CASCADE;

ALTER TABLE mentoring_task_settlement_proposals
    ADD CONSTRAINT fk_task_settlement_proposals_conversation
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;

ALTER TABLE mentoring_task_settlement_proposals
    ADD CONSTRAINT fk_task_settlement_proposals_creator
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_task_settlement_proposals
    ADD CONSTRAINT fk_task_settlement_proposals_recipient
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_task_settlement_proposals
    ADD CONSTRAINT fk_task_settlement_proposals_responder
    FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL;
