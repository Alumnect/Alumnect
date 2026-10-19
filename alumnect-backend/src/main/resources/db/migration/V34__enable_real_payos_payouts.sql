ALTER TABLE mentor_payout_accounts
    ADD COLUMN bank_bin VARCHAR(6);

-- Preserve the only reliably identifiable legacy bank value. Other free-text
-- values must be selected again by the mentor before a real payout is allowed.
UPDATE mentor_payout_accounts
SET bank_bin = '970416', bank_name = 'ACB'
WHERE lower(trim(bank_name)) = 'acb';

ALTER TABLE mentor_payout_accounts
    ADD CONSTRAINT ck_mentor_payout_accounts_bank_bin
        CHECK (bank_bin IS NULL OR bank_bin ~ '^[0-9]{6}$');

ALTER TABLE mentoring_payment_ledgers
    ADD COLUMN idempotency_key VARCHAR(120),
    ADD COLUMN provider_transaction_id VARCHAR(150),
    ADD COLUMN provider_status VARCHAR(50),
    ADD COLUMN failure_code VARCHAR(100),
    ADD COLUMN transacted_at TIMESTAMPTZ;

CREATE UNIQUE INDEX uq_mentoring_ledger_payout_per_task
    ON mentoring_payment_ledgers(task_id, transaction_type)
    WHERE task_id IS NOT NULL AND transaction_type = 'PAYOUT';

CREATE UNIQUE INDEX uq_mentoring_ledger_idempotency_key
    ON mentoring_payment_ledgers(idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX idx_mentoring_ledger_pending_disbursement
    ON mentoring_payment_ledgers(transaction_type, status, updated_at)
    WHERE transaction_type IN ('PAYOUT', 'REFUND') AND status = 'PENDING';

-- Pending payouts created by the mock gateway carry fake references (PO-...) and
-- no idempotency key; re-queue them so the real PayOS dispatcher can submit them.
UPDATE mentoring_payment_ledgers
SET provider_reference = NULL,
    provider_status    = 'QUEUED',
    idempotency_key    = COALESCE(idempotency_key, 'ALUMNECT-PAYOUT-LEDGER-' || id)
WHERE transaction_type = 'PAYOUT'
  AND status = 'PENDING'
  AND (provider_reference IS NULL OR provider_reference LIKE 'PO-%');

-- Payouts/refunds marked SUCCEEDED by the mock gateway never moved real money.
-- Mark them FAILED so the ledger reflects reality; an admin re-sends the payout
-- through PayOS with "Chi lại" (a fresh idempotency key is generated on retry).
UPDATE mentoring_payment_ledgers
SET status          = 'FAILED',
    provider_status = 'MOCK_VOIDED',
    provider_reference = NULL,
    transacted_at   = NULL,
    idempotency_key = COALESCE(idempotency_key, 'ALUMNECT-' || transaction_type || '-LEDGER-' || id),
    note            = 'Lệnh chi giả lập trước đây, chưa chuyển tiền thật. Admin cần chi lại qua PayOS.'
WHERE transaction_type IN ('PAYOUT', 'REFUND')
  AND status <> 'PENDING'
  AND (provider_reference LIKE 'PO-%' OR provider_reference LIKE 'RF-%');

-- Task payments confirmed PAID by PayOS before the ledger existed have no escrow
-- inflow entry; record them from the real payment rows.
INSERT INTO mentoring_payment_ledgers (payment_id, request_id, task_id, deal_id, student_id, mentor_id, amount,
                                       transaction_type, status, provider_reference, deadline_snapshot, note,
                                       created_at, updated_at)
SELECT p.id,
       COALESCE(p.request_id, d.request_id),
       p.task_id,
       p.deal_id,
       d.student_id,
       d.mentor_id,
       p.amount,
       'ESCROW_COLLECTION',
       'SUCCEEDED',
       COALESCE(p.payment_reference, p.order_code::text),
       d.deadline,
       'Ký quỹ thành công đơn hàng orderCode=' || p.order_code || ' cho Task #' || p.task_id,
       COALESCE(p.paid_at, p.updated_at),
       now()
FROM mentoring_task_payments p
JOIN mentoring_deals d ON d.id = p.deal_id
WHERE p.payment_status = 'PAID'
  AND p.task_id IS NOT NULL
  AND COALESCE(p.request_id, d.request_id) IS NOT NULL
  AND NOT EXISTS (SELECT 1
                  FROM mentoring_payment_ledgers l
                  WHERE l.payment_id = p.id
                    AND l.transaction_type = 'ESCROW_COLLECTION');
