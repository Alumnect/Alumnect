-- Migration V43: Hoàn thiện UC123 - cho phép báo cáo do hệ thống tạo và thông báo cho tác giả khi nội dung bị kiểm duyệt

-- Báo cáo do bộ lọc tự động tạo không có người gửi; reporter_id = NULL nghĩa là báo cáo hệ thống
ALTER TABLE reports ALTER COLUMN reporter_id DROP NOT NULL;

-- Tìm nhanh báo cáo hệ thống đang chờ xử lý của một bài viết để cập nhật thay vì tạo bản ghi trùng
CREATE INDEX IF NOT EXISTS idx_reports_post_system_pending
    ON reports (post_id)
    WHERE reporter_id IS NULL AND status = 'PENDING';

-- Bổ sung loại thông báo gửi tác giả khi bài viết bị tự động ẩn hoặc được khôi phục
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS ck_notifications_type;
ALTER TABLE notifications ADD CONSTRAINT ck_notifications_type CHECK (type IN (
    'POST_LIKE', 'POST_COMMENT', 'USER_FOLLOW', 'FORUM_ANSWER', 'REPORT_RESOLVED',
    'WELCOME', 'SYSTEM_BROADCAST', 'MENTORING_REQUEST', 'MENTORING_WORK_LOG',
    'MENTORING_TASK', 'MENTORING_GROUP', 'MENTORING_ACCOUNT', 'CONTENT_MODERATED'
));
