-- Group members now take part in the Chat for Task from the Deal phase.
-- Backfill existing group-request chats: members in the request snapshot (or every
-- JOINED member when the request has no snapshot) who are still JOINED in the group.
INSERT INTO conversation_participants (conversation_id, user_id, role, is_accepted, joined_at)
SELECT DISTINCT c.id, gm.user_id, 'MEMBER', TRUE, now()
FROM conversations c
JOIN mentoring_requests r ON r.id = c.mentoring_request_id
JOIN mentoring_group_members gm ON gm.group_id = r.group_id
WHERE c.type = 'MENTORING'
  AND r.group_id IS NOT NULL
  AND gm.status IN ('JOINED', 'ACTIVE')
  AND gm.user_id <> c.mentoring_student_id
  AND gm.user_id <> c.mentoring_mentor_id
  AND (
        NOT EXISTS (SELECT 1 FROM mentoring_request_members s WHERE s.request_id = r.id)
        OR EXISTS (SELECT 1 FROM mentoring_request_members s WHERE s.request_id = r.id AND s.user_id = gm.user_id)
      )
  AND NOT EXISTS (SELECT 1 FROM conversation_participants p
                  WHERE p.conversation_id = c.id AND p.user_id = gm.user_id);
