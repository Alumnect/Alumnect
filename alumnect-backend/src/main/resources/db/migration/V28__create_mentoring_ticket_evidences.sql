-- ==============================================================================
-- AlumNect Database Migration - Version 28
-- Feature: UC112 - Tạo Dispute Ticket & UC113 - Bằng chứng khiếu nại (Evidence)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Bổ sung các cột thông tin tranh chấp cho mentoring_dispute_tickets
-- ------------------------------------------------------------------------------
ALTER TABLE mentoring_dispute_tickets
    ADD COLUMN IF NOT EXISTS dispute_reason VARCHAR(255),
    ADD COLUMN IF NOT EXISTS desired_solution VARCHAR(255);

-- ------------------------------------------------------------------------------
-- 2. Bảng mentoring_ticket_evidences (Bằng chứng tranh chấp)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentoring_ticket_evidences (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ticket_id               BIGINT NOT NULL,
    uploaded_by             BIGINT NOT NULL,
    title                   VARCHAR(255),
    description             TEXT,
    file_url                VARCHAR(1000) NOT NULL,
    file_name               VARCHAR(255),
    file_size               BIGINT,
    file_type               VARCHAR(50),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. Foreign Key Constraints & Indexes
-- ------------------------------------------------------------------------------
ALTER TABLE mentoring_ticket_evidences
    ADD CONSTRAINT fk_ticket_evidences_ticket
    FOREIGN KEY (ticket_id) REFERENCES mentoring_dispute_tickets(id) ON DELETE CASCADE;

ALTER TABLE mentoring_ticket_evidences
    ADD CONSTRAINT fk_ticket_evidences_user
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_ticket_evidences_ticket_id ON mentoring_ticket_evidences(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_evidences_uploaded_by ON mentoring_ticket_evidences(uploaded_by);
