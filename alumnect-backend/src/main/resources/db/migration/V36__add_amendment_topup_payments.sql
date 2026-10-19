-- Top-up payments: a payment can pay the additional amount of an accepted task amendment.
ALTER TABLE mentoring_task_payments
    ADD COLUMN amendment_id BIGINT REFERENCES mentoring_task_amendments(id) ON DELETE SET NULL;

CREATE INDEX idx_mentoring_task_payments_amendment ON mentoring_task_payments(amendment_id)
    WHERE amendment_id IS NOT NULL;

-- Only the newest accepted amendment of a task may wait for a top-up payment;
-- older ones were left in AWAITING_TOPUP because new tickets did not supersede them.
UPDATE mentoring_task_amendments a
SET status = 'SUPERSEDED'
WHERE a.status = 'AWAITING_TOPUP'
  AND EXISTS (SELECT 1 FROM mentoring_task_amendments n
              WHERE n.task_id = a.task_id AND n.status = 'AWAITING_TOPUP' AND n.id > a.id);
