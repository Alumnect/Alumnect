-- ==============================================================================
-- AlumNect Database Migration - Version 21
-- Feature: Liên kết chuỗi nghiệp vụ Mentoring end-to-end (UC100 → UC105)
--          Request → Mentor Response → Chat for Task → Deal → Payment → Task
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. conversations: bổ sung loại MENTORING (Chat for Task) gắn với Request + Student + Mentor
-- ------------------------------------------------------------------------------
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS ck_conversations_type;
ALTER TABLE conversations
    ADD CONSTRAINT ck_conversations_type CHECK (type IN ('DIRECT', 'GROUP', 'MENTORING'));

ALTER TABLE conversations
    ADD COLUMN mentoring_request_id BIGINT,
    ADD COLUMN mentoring_student_id BIGINT,
    ADD COLUMN mentoring_mentor_id  BIGINT,
    ADD COLUMN mentoring_task_id    BIGINT;

-- Conversation MENTORING bắt buộc có đủ ngữ cảnh Request/Student/Mentor; loại khác không được mang ngữ cảnh Mentoring
ALTER TABLE conversations
    ADD CONSTRAINT ck_conversations_mentoring_context CHECK (
        (type = 'MENTORING'
            AND mentoring_request_id IS NOT NULL
            AND mentoring_student_id IS NOT NULL
            AND mentoring_mentor_id IS NOT NULL)
        OR (type <> 'MENTORING'
            AND mentoring_request_id IS NULL
            AND mentoring_student_id IS NULL
            AND mentoring_mentor_id IS NULL
            AND mentoring_task_id IS NULL)
    );

-- ------------------------------------------------------------------------------
-- 2. mentoring_requests: lưu Mentor được chọn và Deal đã chốt (mỗi Request chốt đúng 1 Mentor)
-- ------------------------------------------------------------------------------
ALTER TABLE mentoring_requests
    ADD COLUMN selected_mentor_id BIGINT,
    ADD COLUMN confirmed_deal_id  BIGINT;

ALTER TABLE mentoring_requests
    ADD CONSTRAINT ck_mentoring_requests_selection_pair
    CHECK ((selected_mentor_id IS NULL) = (confirmed_deal_id IS NULL));

-- ------------------------------------------------------------------------------
-- 3. mentoring_deals: Deal Ticket bắt buộc thuộc Request + Conversation
-- ------------------------------------------------------------------------------
-- 3.1 Làm sạch request_id trỏ tới Request không tồn tại (cột trước đây không có khóa ngoại)
UPDATE mentoring_deals d
SET request_id = NULL
WHERE d.request_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM mentoring_requests r WHERE r.id = d.request_id);

-- 3.2 Deal tạo trước V21 thuộc luồng cũ (gắn DM chung, không có Chat for Task của Request):
--     Deal chưa thanh toán không thể tiếp tục → CANCELLED; tách khỏi DM chung để DM có thể xóa bình thường.
--     Deal đã thanh toán giữ nguyên is_paid/Task (Task vẫn giữ conversation_id riêng của nó).
UPDATE mentoring_deals
SET status = 'CANCELLED',
    updated_at = now()
WHERE is_paid = FALSE
  AND status <> 'CANCELLED';

UPDATE mentoring_deals
SET conversation_id = NULL
WHERE conversation_id IS NOT NULL;

-- 3.3 Mọi Deal tạo mới bắt buộc có request_id và conversation_id (NOT VALID: không kiểm tra lại bản ghi legacy)
ALTER TABLE mentoring_deals
    ADD CONSTRAINT ck_mentoring_deals_request_context
    CHECK (request_id IS NOT NULL AND conversation_id IS NOT NULL) NOT VALID;

-- ------------------------------------------------------------------------------
-- 4. mentoring_tasks: Task truy ngược được Request; mở rộng task_type theo cả UC100 và UC104
-- ------------------------------------------------------------------------------
ALTER TABLE mentoring_tasks
    ADD COLUMN request_id BIGINT;

UPDATE mentoring_tasks t
SET request_id = d.request_id
FROM mentoring_deals d
WHERE d.id = t.deal_id
  AND t.request_id IS NULL;

ALTER TABLE mentoring_tasks
    ADD CONSTRAINT ck_mentoring_tasks_request_context
    CHECK (request_id IS NOT NULL) NOT VALID;

ALTER TABLE mentoring_tasks DROP CONSTRAINT IF EXISTS ck_mentoring_tasks_task_type;
ALTER TABLE mentoring_tasks
    ADD CONSTRAINT ck_mentoring_tasks_task_type CHECK (task_type IN (
        'CAREER_ORIENTATION', 'TECHNICAL_CONSULTING', 'CAPSTONE_ADVICE',
        'CONSULTATION', 'ASSIGNMENT_GUIDANCE', 'PROJECT_MENTORING',
        'RESUME_REVIEW', 'MOCK_INTERVIEW', 'SKILL_TRAINING', 'OTHER'
    ));

-- ==============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ==============================================================================
ALTER TABLE conversations
    ADD CONSTRAINT fk_conversations_mentoring_request
    FOREIGN KEY (mentoring_request_id) REFERENCES mentoring_requests(id) ON DELETE CASCADE;

ALTER TABLE conversations
    ADD CONSTRAINT fk_conversations_mentoring_student
    FOREIGN KEY (mentoring_student_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE conversations
    ADD CONSTRAINT fk_conversations_mentoring_mentor
    FOREIGN KEY (mentoring_mentor_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE conversations
    ADD CONSTRAINT fk_conversations_mentoring_task
    FOREIGN KEY (mentoring_task_id) REFERENCES mentoring_tasks(id) ON DELETE SET NULL;

ALTER TABLE mentoring_requests
    ADD CONSTRAINT fk_mentoring_requests_selected_mentor
    FOREIGN KEY (selected_mentor_id) REFERENCES users(id) ON DELETE NO ACTION;

ALTER TABLE mentoring_requests
    ADD CONSTRAINT fk_mentoring_requests_confirmed_deal
    FOREIGN KEY (confirmed_deal_id) REFERENCES mentoring_deals(id) ON DELETE NO ACTION;

-- Deal Ticket không được mất liên kết Conversation (trước đây ON DELETE SET NULL tạo Deal mồ côi)
ALTER TABLE mentoring_deals DROP CONSTRAINT IF EXISTS fk_mentoring_deals_conversation_id;
ALTER TABLE mentoring_deals
    ADD CONSTRAINT fk_mentoring_deals_conversation_id
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE NO ACTION;

ALTER TABLE mentoring_deals
    ADD CONSTRAINT fk_mentoring_deals_request
    FOREIGN KEY (request_id) REFERENCES mentoring_requests(id) ON DELETE CASCADE;

ALTER TABLE mentoring_tasks
    ADD CONSTRAINT fk_mentoring_tasks_request
    FOREIGN KEY (request_id) REFERENCES mentoring_requests(id) ON DELETE RESTRICT;

-- ==============================================================================
-- UNIQUE CONSTRAINTS & INDEXES
-- ==============================================================================
-- Mỗi bộ (Request, Student, Mentor) chỉ có duy nhất 1 Chat for Task (idempotent khi Mentor ACCEPT lại)
CREATE UNIQUE INDEX uq_conversations_mentoring_context
    ON conversations (mentoring_request_id, mentoring_student_id, mentoring_mentor_id)
    WHERE mentoring_request_id IS NOT NULL;

-- Mỗi Chat for Task chỉ có 1 luồng Deal; các phiên bản nằm trong mentoring_deal_snapshots (deal_id, version)
CREATE UNIQUE INDEX uq_mentoring_deals_conversation
    ON mentoring_deals (conversation_id)
    WHERE request_id IS NOT NULL AND conversation_id IS NOT NULL;

-- Mỗi Request chỉ có tối đa 1 Deal ở trạng thái DEAL_CONFIRMED (chống 2 Mentor cùng thắng khi xác nhận đồng thời)
CREATE UNIQUE INDEX uq_mentoring_deals_request_confirmed
    ON mentoring_deals (request_id)
    WHERE status = 'DEAL_CONFIRMED' AND request_id IS NOT NULL;

-- Mỗi Deal đã chốt chỉ được gắn làm confirmed deal của đúng 1 Request
CREATE UNIQUE INDEX uq_mentoring_requests_confirmed_deal
    ON mentoring_requests (confirmed_deal_id)
    WHERE confirmed_deal_id IS NOT NULL;

CREATE INDEX idx_conversations_mentoring_request ON conversations (mentoring_request_id);
CREATE INDEX idx_conversations_mentoring_mentor ON conversations (mentoring_mentor_id);
CREATE INDEX idx_conversations_mentoring_task ON conversations (mentoring_task_id);
CREATE INDEX idx_mentoring_requests_selected_mentor ON mentoring_requests (selected_mentor_id);
CREATE INDEX idx_mentoring_tasks_request_id ON mentoring_tasks (request_id);

-- ==============================================================================
-- BACKFILL: tạo Chat for Task cho các phản hồi đã ACCEPTED trước khi có migration này
-- ==============================================================================
DO $$
DECLARE
    rec         RECORD;
    new_conv_id BIGINT;
BEGIN
    FOR rec IN
        SELECT r.id                              AS request_id,
               r.title                           AS request_title,
               r.student_id                      AS student_id,
               mp.user_id                        AS mentor_user_id,
               COALESCE(up.full_name, u.email)   AS mentor_name,
               COALESCE(d.responded_at, now())   AS accepted_at
        FROM mentoring_request_distributions d
        JOIN mentoring_requests r ON r.id = d.request_id
        JOIN mentor_profiles mp ON mp.id = d.mentor_profile_id
        JOIN users u ON u.id = mp.user_id
        LEFT JOIN user_profiles up ON up.user_id = mp.user_id
        WHERE d.status = 'ACCEPTED'
          AND NOT EXISTS (
              SELECT 1 FROM conversations c
              WHERE c.mentoring_request_id = r.id
                AND c.mentoring_mentor_id = mp.user_id
          )
    LOOP
        INSERT INTO conversations (type, title, created_by, created_at, last_message_at,
                                   mentoring_request_id, mentoring_student_id, mentoring_mentor_id)
        VALUES ('MENTORING', rec.request_title, rec.mentor_user_id, rec.accepted_at, rec.accepted_at,
                rec.request_id, rec.student_id, rec.mentor_user_id)
        RETURNING id INTO new_conv_id;

        INSERT INTO conversation_participants (conversation_id, user_id, role, is_accepted, joined_at)
        VALUES (new_conv_id, rec.student_id, 'MEMBER', TRUE, rec.accepted_at),
               (new_conv_id, rec.mentor_user_id, 'MEMBER', TRUE, rec.accepted_at);

        INSERT INTO messages (conversation_id, sender_id, content, message_type, created_at)
        VALUES (new_conv_id, rec.mentor_user_id,
                rec.mentor_name || ' đã đồng ý trao đổi về Request của bạn.',
                'SYSTEM', rec.accepted_at);
    END LOOP;
END $$;
