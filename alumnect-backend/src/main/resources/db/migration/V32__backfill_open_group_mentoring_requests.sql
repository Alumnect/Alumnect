-- Requests created while the group feature was being deployed may not have a
-- mentoring_groups row yet. The selected invitees were not persisted by the
-- legacy API, so restore the group and its leader; the leader can then resend
-- invitations from the group management screen.
DO $$
DECLARE
    request_row RECORD;
    created_group_id BIGINT;
BEGIN
    FOR request_row IN
        SELECT id, student_id, title, created_at, updated_at
        FROM mentoring_requests
        WHERE participation_type = 'GROUP'
          AND group_id IS NULL
          AND status IN ('OPEN', 'MATCHED')
    LOOP
        INSERT INTO mentoring_groups (name, leader_id, status, created_at, updated_at)
        VALUES (
            LEFT('Nhóm mentoring · ' || request_row.title, 200),
            request_row.student_id,
            'ACTIVE',
            request_row.created_at,
            request_row.updated_at
        )
        RETURNING id INTO created_group_id;

        INSERT INTO mentoring_group_members (
            group_id, user_id, invited_by, status, invited_at, joined_at, updated_at
        ) VALUES (
            created_group_id,
            request_row.student_id,
            request_row.student_id,
            'ACTIVE',
            request_row.created_at,
            request_row.created_at,
            request_row.updated_at
        );

        UPDATE mentoring_requests
        SET group_id = created_group_id
        WHERE id = request_row.id;
    END LOOP;
END $$;
