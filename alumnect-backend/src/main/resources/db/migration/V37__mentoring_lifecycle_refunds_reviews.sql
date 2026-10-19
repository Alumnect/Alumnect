-- 1. Account-level mentoring notifications (request closed, subscription, payout, refund)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS ck_notifications_type;
ALTER TABLE notifications ADD CONSTRAINT ck_notifications_type CHECK (type IN (
    'POST_LIKE', 'POST_COMMENT', 'USER_FOLLOW', 'FORUM_ANSWER', 'REPORT_RESOLVED', 'WELCOME', 'SYSTEM_BROADCAST',
    'MENTORING_WORK_LOG', 'MENTORING_TASK', 'MENTORING_GROUP', 'MENTORING_ACCOUNT'));

-- 2. Requests past their expected deadline are closed by the system
ALTER TABLE mentoring_requests DROP CONSTRAINT IF EXISTS ck_mentoring_requests_status;
ALTER TABLE mentoring_requests ADD CONSTRAINT ck_mentoring_requests_status
    CHECK (status IN ('OPEN', 'MATCHED', 'CLOSED', 'CANCELLED', 'EXPIRED'));

-- 3. A review belongs to one completed task (one review per task)
ALTER TABLE mentor_reviews ADD COLUMN task_id BIGINT REFERENCES mentoring_tasks(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX uq_mentor_reviews_task ON mentor_reviews(task_id) WHERE task_id IS NOT NULL;

-- 4. Bank account where a student receives refunds
CREATE TABLE user_refund_accounts (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id             BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    bank_name           VARCHAR(100) NOT NULL,
    bank_bin            VARCHAR(6)   NOT NULL CHECK (bank_bin ~ '^[0-9]{6}$'),
    bank_account_number VARCHAR(50)  NOT NULL,
    bank_account_holder VARCHAR(150) NOT NULL,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 5. Refunds were parked waiting for a feature that did not exist; queue them for the PayOS disbursement job
UPDATE mentoring_payment_ledgers
SET provider_status = 'QUEUED',
    idempotency_key = COALESCE(idempotency_key, 'ALUMNECT-REFUND-LEDGER-' || id)
WHERE transaction_type = 'REFUND'
  AND status = 'PENDING'
  AND provider_reference IS NULL;

-- 6. completed_tasks counted reviews instead of tasks; recompute from real completed tasks
UPDATE mentor_profiles mp
SET completed_tasks = (SELECT COUNT(*) FROM mentoring_tasks t
                       WHERE t.mentor_id = mp.user_id AND t.status = 'COMPLETED');
