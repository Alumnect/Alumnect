-- ============================================================================
-- V10: Tạo bảng lưu trữ thông báo người dùng (notifications)
-- Hỗ trợ 6 kịch bản thông báo: Thích bài viết, Bình luận, Theo dõi, Trả lời Q&A,
-- Báo cáo vi phạm (gỡ bài), và Chào đón khi kích hoạt tài khoản ACTIVE.
-- Tuân thủ quy chuẩn: Từ khóa viết hoa, Khóa ngoại ALTER TABLE và INDEX ở cuối file
-- ============================================================================

CREATE TABLE notifications (
    id            BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient_id  BIGINT        NOT NULL,
    sender_id     BIGINT,
    type          VARCHAR(50)   NOT NULL,
    title         VARCHAR(255),
    content       TEXT          NOT NULL,
    target_type   VARCHAR(50),
    target_id     VARCHAR(100),
    sender_count  INT           NOT NULL DEFAULT 1,
    is_read       BOOLEAN       NOT NULL DEFAULT false,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_notifications_type CHECK (type IN ('POST_LIKE', 'POST_COMMENT', 'USER_FOLLOW', 'FORUM_ANSWER', 'REPORT_RESOLVED', 'WELCOME'))
);

-- Khóa ngoại trỏ đến bảng users
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE SET NULL;

-- Các chỉ mục tối ưu truy vấn
CREATE INDEX idx_notifications_recipient_read ON notifications (recipient_id, is_read);
CREATE INDEX idx_notifications_recipient_created ON notifications (recipient_id, created_at DESC);
CREATE INDEX idx_notifications_grouping ON notifications (recipient_id, type, target_type, target_id, is_read);
