-- ==============================================================================
-- AlumNect Database Migration - Version 24
-- Feature: Điều chỉnh luồng xác nhận Deal và thanh toán Mentoring Task (UC104 - UC105)
--          - Cho phép nhiều Deal cùng đạt trạng thái DEAL_CONFIRMED cho 1 Request
--          - Chốt Mentor và đóng các luồng khác chỉ khi thanh toán thành công
--          - Bổ sung sổ quỹ giao dịch Mentoring (mentoring_payment_ledgers)
--          - Ràng buộc duy nhất 1 checkout PENDING và 1 Task trên mỗi Request
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Xóa bỏ unique index cũ giới hạn 1 DEAL_CONFIRMED trên 1 Request
--    Cho phép Student thỏa thuận và xác nhận với nhiều Mentor để chọn phương án tốt nhất
-- ------------------------------------------------------------------------------
DROP INDEX IF EXISTS uq_mentoring_deals_request_confirmed;

-- ------------------------------------------------------------------------------
-- 2. Đảm bảo ràng buộc duy nhất cho Mentoring Task theo Request
--    Chỉ có tối đa 1 Task được kích hoạt cho mỗi Request
-- ------------------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uq_mentoring_tasks_request_id
    ON mentoring_tasks (request_id)
    WHERE request_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 3. Nâng cấp mentoring_task_payments: bổ sung request_id, version và ràng buộc checkout active
-- ------------------------------------------------------------------------------
ALTER TABLE mentoring_task_payments
    ADD COLUMN IF NOT EXISTS request_id BIGINT,
    ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 0;

-- Backfill request_id từ mentoring_deals nếu còn thiếu
UPDATE mentoring_task_payments p
SET request_id = d.request_id
FROM mentoring_deals d
WHERE d.id = p.deal_id
  AND p.request_id IS NULL;

-- Ràng buộc khóa ngoại request_id
ALTER TABLE mentoring_task_payments DROP CONSTRAINT IF EXISTS fk_mentoring_task_payments_request;
ALTER TABLE mentoring_task_payments
    ADD CONSTRAINT fk_mentoring_task_payments_request
    FOREIGN KEY (request_id) REFERENCES mentoring_requests(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_mentoring_task_payments_request_id
    ON mentoring_task_payments(request_id);

-- Ràng buộc: Mỗi Request chỉ có tối đa 1 phiên checkout đang PENDING còn hiệu lực
CREATE UNIQUE INDEX IF NOT EXISTS uq_mentoring_task_payments_request_pending
    ON mentoring_task_payments (request_id)
    WHERE payment_status = 'PENDING' AND request_id IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 4. Bảng mentoring_payment_ledgers: Sổ quỹ dòng tiền Mentoring (Escrow, Payout, Refund)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mentoring_payment_ledgers (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    payment_id          BIGINT,
    request_id          BIGINT NOT NULL,
    task_id             BIGINT,
    deal_id             BIGINT NOT NULL,
    student_id          BIGINT NOT NULL,
    mentor_id           BIGINT NOT NULL,
    amount              NUMERIC(12, 2) NOT NULL,
    transaction_type    VARCHAR(30) NOT NULL,
    status              VARCHAR(30) NOT NULL,
    provider_reference  VARCHAR(150),
    deadline_snapshot   TIMESTAMPTZ,
    note                TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentoring_payment_ledgers_type CHECK (transaction_type IN ('ESCROW_COLLECTION', 'PAYOUT', 'REFUND')),
    CONSTRAINT ck_mentoring_payment_ledgers_status CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED')),
    CONSTRAINT ck_mentoring_payment_ledgers_amount CHECK (amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_mentoring_payment_ledgers_request_id ON mentoring_payment_ledgers(request_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_payment_ledgers_task_id ON mentoring_payment_ledgers(task_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_payment_ledgers_deal_id ON mentoring_payment_ledgers(deal_id);

-- Idempotency: Mỗi giao dịch thanh toán chỉ sinh tối đa 1 bản ghi sổ quỹ cho 1 loại nghiệp vụ
CREATE UNIQUE INDEX IF NOT EXISTS uq_mentoring_payment_ledgers_payment_type
    ON mentoring_payment_ledgers (payment_id, transaction_type)
    WHERE payment_id IS NOT NULL;

ALTER TABLE mentoring_payment_ledgers DROP CONSTRAINT IF EXISTS fk_mentoring_payment_ledgers_payment;
ALTER TABLE mentoring_payment_ledgers
    ADD CONSTRAINT fk_mentoring_payment_ledgers_payment
    FOREIGN KEY (payment_id) REFERENCES mentoring_task_payments(id) ON DELETE SET NULL;

ALTER TABLE mentoring_payment_ledgers DROP CONSTRAINT IF EXISTS fk_mentoring_payment_ledgers_request;
ALTER TABLE mentoring_payment_ledgers
    ADD CONSTRAINT fk_mentoring_payment_ledgers_request
    FOREIGN KEY (request_id) REFERENCES mentoring_requests(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_payment_ledgers DROP CONSTRAINT IF EXISTS fk_mentoring_payment_ledgers_task;
ALTER TABLE mentoring_payment_ledgers
    ADD CONSTRAINT fk_mentoring_payment_ledgers_task
    FOREIGN KEY (task_id) REFERENCES mentoring_tasks(id) ON DELETE SET NULL;

ALTER TABLE mentoring_payment_ledgers DROP CONSTRAINT IF EXISTS fk_mentoring_payment_ledgers_deal;
ALTER TABLE mentoring_payment_ledgers
    ADD CONSTRAINT fk_mentoring_payment_ledgers_deal
    FOREIGN KEY (deal_id) REFERENCES mentoring_deals(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_payment_ledgers DROP CONSTRAINT IF EXISTS fk_mentoring_payment_ledgers_student;
ALTER TABLE mentoring_payment_ledgers
    ADD CONSTRAINT fk_mentoring_payment_ledgers_student
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE mentoring_payment_ledgers DROP CONSTRAINT IF EXISTS fk_mentoring_payment_ledgers_mentor;
ALTER TABLE mentoring_payment_ledgers
    ADD CONSTRAINT fk_mentoring_payment_ledgers_mentor
    FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE RESTRICT;
