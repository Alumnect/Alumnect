-- Proposal creators can withdraw pending deadline extensions and settlement proposals,
-- and the system closes leftover proposals when a task stops being active.
ALTER TABLE mentoring_task_deadline_extensions DROP CONSTRAINT IF EXISTS ck_task_deadline_extensions_status;
ALTER TABLE mentoring_task_deadline_extensions ADD CONSTRAINT ck_task_deadline_extensions_status
    CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'SUPERSEDED', 'CANCELLED'));

ALTER TABLE mentoring_task_settlement_proposals DROP CONSTRAINT IF EXISTS ck_task_settlement_proposals_status;
ALTER TABLE mentoring_task_settlement_proposals ADD CONSTRAINT ck_task_settlement_proposals_status
    CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'SUPERSEDED', 'CANCELLED'));

-- Proposals still pending on tasks that are no longer active can never be answered
UPDATE mentoring_task_deadline_extensions e SET status = 'CANCELLED'
WHERE e.status = 'PENDING'
  AND EXISTS (SELECT 1 FROM mentoring_tasks t WHERE t.id = e.task_id
              AND t.status IN ('COMPLETED', 'CANCELLED', 'RESOLVED', 'DISPUTED'));
UPDATE mentoring_task_amendments a SET status = 'CANCELLED'
WHERE a.status IN ('PENDING', 'AWAITING_TOPUP')
  AND EXISTS (SELECT 1 FROM mentoring_tasks t WHERE t.id = a.task_id
              AND t.status IN ('COMPLETED', 'CANCELLED', 'RESOLVED', 'DISPUTED'));
UPDATE mentoring_task_settlement_proposals p SET status = 'CANCELLED'
WHERE p.status = 'PENDING'
  AND EXISTS (SELECT 1 FROM mentoring_tasks t WHERE t.id = p.task_id
              AND t.status IN ('COMPLETED', 'CANCELLED', 'RESOLVED', 'DISPUTED'));
