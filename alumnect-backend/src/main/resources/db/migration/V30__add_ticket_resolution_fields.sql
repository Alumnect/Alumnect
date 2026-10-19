-- ==============================================================================
-- V30: Bổ sung các trường phán quyết và giải quyết Ticket cho Admin (UC120)
--      - Thêm các trường decision, dispute_fee, settlement_status
--      - Thêm liên kết sổ quỹ mentor_payout_ledger_id và student_refund_ledger_id
--      - Mở rộng trạng thái mentoring_tasks hỗ trợ RESOLVED
-- ==============================================================================

-- 1. Bổ sung các cột phán quyết cho mentoring_dispute_tickets
ALTER TABLE mentoring_dispute_tickets
    ADD COLUMN IF NOT EXISTS decision VARCHAR(50),
    ADD COLUMN IF NOT EXISTS dispute_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS settlement_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN IF NOT EXISTS mentor_payout_ledger_id BIGINT,
    ADD COLUMN IF NOT EXISTS student_refund_ledger_id BIGINT;

-- 2. Ràng buộc khóa ngoại tới sổ quỹ giao dịch
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_dispute_tickets_payout_ledger'
    ) THEN
        ALTER TABLE mentoring_dispute_tickets
            ADD CONSTRAINT fk_dispute_tickets_payout_ledger
            FOREIGN KEY (mentor_payout_ledger_id) REFERENCES mentoring_payment_ledgers(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_dispute_tickets_refund_ledger'
    ) THEN
        ALTER TABLE mentoring_dispute_tickets
            ADD CONSTRAINT fk_dispute_tickets_refund_ledger
            FOREIGN KEY (student_refund_ledger_id) REFERENCES mentoring_payment_ledgers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Mở rộng trạng thái bảng mentoring_tasks để hỗ trợ RESOLVED (đã giải quyết tranh chấp)
ALTER TABLE mentoring_tasks DROP CONSTRAINT IF EXISTS ck_mentoring_tasks_status;
ALTER TABLE mentoring_tasks ADD CONSTRAINT ck_mentoring_tasks_status
    CHECK (status IN ('PREPARATION', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'CANCELLED', 'DISPUTED', 'RESOLVED'));

-- 4. Tạo các chỉ mục tối ưu truy vấn
CREATE INDEX IF NOT EXISTS idx_dispute_tickets_decision ON mentoring_dispute_tickets(decision);
CREATE INDEX IF NOT EXISTS idx_dispute_tickets_settlement_status ON mentoring_dispute_tickets(settlement_status);
