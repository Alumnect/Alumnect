-- ==============================================================================
-- Migration V29: Tạo bảng lưu trữ tin nhắn và trao đổi trong Ticket tranh chấp (UC119)
-- Cho phép Student, Mentor và Admin thảo luận, thương lượng giải pháp hòa giải và audit.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS mentoring_ticket_messages (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    sender_role VARCHAR(30) NOT NULL, -- 'ADMIN', 'STUDENT', 'MENTOR'
    message_type VARCHAR(30) NOT NULL DEFAULT 'TEXT', -- 'TEXT', 'MEDIATION_OFFER', 'DEADLINE_REQUEST'
    content TEXT NOT NULL,
    attachments TEXT, -- Lưu mảng JSON các file đính kèm: [{ fileUrl, fileName, fileType, fileSize }]
    proposed_mentor_amount NUMERIC(15, 2),
    proposed_student_refund NUMERIC(15, 2),
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ticket_messages_ticket FOREIGN KEY (ticket_id) REFERENCES mentoring_dispute_tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON mentoring_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON mentoring_ticket_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON mentoring_ticket_messages(created_at);
