-- ============================================================================
-- V8: Tạo các bảng phục vụ tính năng Nhắn tin trực tiếp 1-1 (Direct Messaging)
-- Bao gồm: conversations, conversation_participants, messages, message_attachments
-- Tuân thủ quy chuẩn: Khóa ngoại ALTER TABLE và INDEX đặt ở cuối file
-- ============================================================================

-- 1. Bảng lưu thông tin cuộc hội thoại
CREATE TABLE conversations (
    id               BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_message_at  TIMESTAMPTZ
);

-- 2. Bảng lưu thành viên tham gia cuộc hội thoại và trạng thái đọc
CREATE TABLE conversation_participants (
    id                    BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id       BIGINT       NOT NULL,
    user_id               BIGINT       NOT NULL,
    last_read_message_id  BIGINT,
    is_archived           BOOLEAN      NOT NULL DEFAULT false,
    joined_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversation_participants_conv_user UNIQUE (conversation_id, user_id)
);

-- 3. Bảng lưu tin nhắn trong cuộc hội thoại
CREATE TABLE messages (
    id               BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id  BIGINT       NOT NULL,
    sender_id        BIGINT       NOT NULL,
    content          TEXT,
    is_deleted       BOOLEAN      NOT NULL DEFAULT false,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 4. Bảng lưu tệp đính kèm (Hình ảnh, Video, Tài liệu) của tin nhắn
CREATE TABLE message_attachments (
    id          BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message_id  BIGINT        NOT NULL,
    media_type  VARCHAR(10)   NOT NULL DEFAULT 'FILE',
    url         VARCHAR(500)  NOT NULL,
    file_name   VARCHAR(255),
    file_size   BIGINT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_message_attachments_media_type CHECK (media_type IN ('IMAGE', 'VIDEO', 'FILE'))
);

-- ============================================================================
-- RÀNG BUỘC KHÓA NGOẠI (FOREIGN KEYS)
-- ============================================================================

-- Khóa ngoại cho conversation_participants
ALTER TABLE conversation_participants 
    ADD CONSTRAINT fk_conversation_participants_conversation_id 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE conversation_participants 
    ADD CONSTRAINT fk_conversation_participants_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE conversation_participants 
    ADD CONSTRAINT fk_conversation_participants_last_read_message_id 
    FOREIGN KEY (last_read_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Khóa ngoại cho messages
ALTER TABLE messages 
    ADD CONSTRAINT fk_messages_conversation_id 
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE messages 
    ADD CONSTRAINT fk_messages_sender_id 
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;

-- Khóa ngoại cho message_attachments
ALTER TABLE message_attachments 
    ADD CONSTRAINT fk_message_attachments_message_id 
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;

-- ============================================================================
-- CHỈ MỤC TỐI ƯU TRUY VẤN (INDEXES)
-- ============================================================================

CREATE INDEX idx_conversation_participants_user_id ON conversation_participants (user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants (conversation_id);
CREATE INDEX idx_messages_conversation_id_created_at ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages (sender_id);
CREATE INDEX idx_message_attachments_message_id ON message_attachments (message_id);
CREATE INDEX idx_conversations_last_message_at ON conversations (last_message_at DESC NULLS LAST);
