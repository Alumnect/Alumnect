CREATE TABLE mentoring_groups (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    leader_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_mentoring_groups_status CHECK (status IN ('ACTIVE', 'CLOSED', 'CANCELLED'))
);

CREATE TABLE mentoring_group_members (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES mentoring_groups(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id),
    invited_by BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL,
    invited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    joined_at TIMESTAMPTZ,
    removed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_mentoring_group_member UNIQUE (group_id, user_id),
    CONSTRAINT ck_mentoring_group_member_status CHECK (status IN ('INVITED', 'ACTIVE', 'DECLINED', 'REMOVED'))
);

CREATE TABLE mentoring_group_member_events (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES mentoring_groups(id) ON DELETE CASCADE,
    member_user_id BIGINT NOT NULL REFERENCES users(id),
    actor_id BIGINT NOT NULL REFERENCES users(id),
    action VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_mentoring_group_member_action CHECK (action IN ('INVITED', 'ACCEPTED', 'DECLINED', 'REMOVED', 'REINVITED'))
);

ALTER TABLE mentoring_requests
    ADD COLUMN group_id BIGINT REFERENCES mentoring_groups(id),
    ADD COLUMN client_request_key VARCHAR(64);

CREATE UNIQUE INDEX uq_mentoring_requests_group_id ON mentoring_requests(group_id) WHERE group_id IS NOT NULL;
CREATE UNIQUE INDEX uq_mentoring_requests_student_client_key
    ON mentoring_requests(student_id, client_request_key) WHERE client_request_key IS NOT NULL;
CREATE INDEX idx_mentoring_group_members_user_status ON mentoring_group_members(user_id, status);
CREATE INDEX idx_mentoring_group_events_group ON mentoring_group_member_events(group_id, created_at);

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS ck_notifications_type;
ALTER TABLE notifications ADD CONSTRAINT ck_notifications_type CHECK (type IN (
    'POST_LIKE', 'POST_COMMENT', 'USER_FOLLOW', 'FORUM_ANSWER', 'REPORT_RESOLVED',
    'WELCOME', 'SYSTEM_BROADCAST', 'MENTORING_WORK_LOG', 'MENTORING_TASK', 'MENTORING_GROUP'
));
