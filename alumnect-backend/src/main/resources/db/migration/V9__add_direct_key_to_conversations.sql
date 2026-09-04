-- ============================================================================
-- V9: Thêm cột direct_key và ràng buộc UNIQUE chống trùng lặp hội thoại 1-1
-- Đảm bảo ở tầng CSDL không bao giờ có 2 cuộc trò chuyện 1-1 giữa cùng 2 người dùng
-- ============================================================================

ALTER TABLE conversations ADD COLUMN direct_key VARCHAR(100);

ALTER TABLE conversations ADD CONSTRAINT uq_conversations_direct_key UNIQUE (direct_key);

CREATE INDEX idx_conversations_direct_key ON conversations (direct_key);
