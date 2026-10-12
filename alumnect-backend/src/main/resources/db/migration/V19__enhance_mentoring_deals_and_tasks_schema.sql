-- ==============================================================================
-- AlumNect Database Migration - Version 19
-- Feature: Flow 3 - Mentoring Deal & Task Enhancements (UC104 & UC105)
-- Bổ sung liên kết Request, Deal Ticket và nguồn đề xuất (REQUEST_ACCEPTANCE / RENEGOTIATION)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- 1. Bổ sung các cột liên quan đến Request & Deal Ticket vào bảng mentoring_deals
ALTER TABLE mentoring_deals 
    ADD COLUMN IF NOT EXISTS request_id BIGINT,
    ADD COLUMN IF NOT EXISTS ticket_type VARCHAR(20) NOT NULL DEFAULT 'DEAL',
    ADD COLUMN IF NOT EXISTS proposal_source VARCHAR(30) NOT NULL DEFAULT 'RENEGOTIATION';

-- 2. Cập nhật ràng buộc trạng thái Deal để bổ sung SUPERSEDED và REJECTED
ALTER TABLE mentoring_deals 
    DROP CONSTRAINT IF EXISTS ck_mentoring_deals_status;

ALTER TABLE mentoring_deals 
    ADD CONSTRAINT ck_mentoring_deals_status 
    CHECK (status IN ('PROPOSED', 'STUDENT_CONFIRMED', 'MENTOR_CONFIRMED', 'DEAL_CONFIRMED', 'SUPERSEDED', 'CANCELLED', 'REJECTED'));

-- 3. Ràng buộc nguồn đề xuất Deal Ticket
ALTER TABLE mentoring_deals
    DROP CONSTRAINT IF EXISTS ck_mentoring_deals_proposal_source;

ALTER TABLE mentoring_deals 
    ADD CONSTRAINT ck_mentoring_deals_proposal_source 
    CHECK (proposal_source IN ('REQUEST_ACCEPTANCE', 'RENEGOTIATION'));

-- 4. Bổ sung các cột vào bảng mentoring_deal_snapshots
ALTER TABLE mentoring_deal_snapshots 
    ADD COLUMN IF NOT EXISTS ticket_type VARCHAR(20) NOT NULL DEFAULT 'DEAL',
    ADD COLUMN IF NOT EXISTS proposal_source VARCHAR(30) NOT NULL DEFAULT 'RENEGOTIATION';

-- 5. Bổ sung liên kết conversation_id (Chat for Task) vào bảng mentoring_tasks
ALTER TABLE mentoring_tasks 
    ADD COLUMN IF NOT EXISTS conversation_id BIGINT;

-- 6. Tạo khóa ngoại và Index tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_mentoring_deals_request_id ON mentoring_deals(request_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_tasks_conversation_id ON mentoring_tasks(conversation_id);

ALTER TABLE mentoring_tasks
    ADD CONSTRAINT fk_mentoring_tasks_conversation 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;
