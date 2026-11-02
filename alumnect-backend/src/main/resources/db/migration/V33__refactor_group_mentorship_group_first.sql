-- V33: Refactor Group Mentorship sang mo hinh Group-First
-- 1. Cho phep mot Group duoc tai su dung cho nhieu Mentoring Request (xoa UNIQUE constraint)
DROP INDEX IF EXISTS uq_mentoring_requests_group_id;
CREATE INDEX IF NOT EXISTS idx_mentoring_requests_group_id ON mentoring_requests(group_id);

-- 2. Cap nhat rang buoc trang thai thanh vien nhom Mentoring (PENDING, JOINED, DECLINED, REMOVED, CANCELLED)
-- Dong thoi tuong thich nguoc voi INVITED, ACTIVE cu
-- Xoa rang buoc cu truoc: rang buoc cu chi cho phep INVITED/ACTIVE nen UPDATE se vi pham CHECK
ALTER TABLE mentoring_group_members DROP CONSTRAINT IF EXISTS ck_mentoring_group_member_status;

UPDATE mentoring_group_members SET status = 'PENDING' WHERE status = 'INVITED';
UPDATE mentoring_group_members SET status = 'JOINED' WHERE status = 'ACTIVE';

ALTER TABLE mentoring_group_members ADD CONSTRAINT ck_mentoring_group_member_status
    CHECK (status IN ('PENDING', 'JOINED', 'DECLINED', 'REMOVED', 'CANCELLED', 'INVITED', 'ACTIVE'));

-- 3. Bo sung cac action CANCELLED va LEFT vao audit event cua thanh vien nhom
ALTER TABLE mentoring_group_member_events DROP CONSTRAINT IF EXISTS ck_mentoring_group_member_action;
ALTER TABLE mentoring_group_member_events ADD CONSTRAINT ck_mentoring_group_member_action
    CHECK (action IN ('INVITED', 'ACCEPTED', 'DECLINED', 'REMOVED', 'REINVITED', 'CANCELLED', 'LEFT'));

-- 4. Tao bang mentoring_request_members de luu snapshot thanh vien JOINED tai thoi diem gui request
CREATE TABLE IF NOT EXISTS mentoring_request_members (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES mentoring_requests(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_mentoring_request_member UNIQUE (request_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_mentoring_request_members_request ON mentoring_request_members(request_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_request_members_user ON mentoring_request_members(user_id);

-- 5. Backfill snapshot cho cac mentoring request nhom hien co
INSERT INTO mentoring_request_members (request_id, user_id, joined_at)
SELECT mr.id, mgm.user_id, COALESCE(mgm.joined_at, mr.created_at)
FROM mentoring_requests mr
JOIN mentoring_group_members mgm ON mgm.group_id = mr.group_id
WHERE mr.group_id IS NOT NULL
  AND mgm.status IN ('JOINED', 'ACTIVE')
ON CONFLICT (request_id, user_id) DO NOTHING;
