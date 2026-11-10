-- Migration V44: Hỗ trợ UC08 - Chuyển đổi tài khoản Sinh viên lên Cựu sinh viên (Upgrade Student to Alumni)

-- 1. Tối ưu hóa truy vấn tìm phiếu yêu cầu xác minh/nâng cấp mới nhất của một người dùng
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_created_at
    ON verification_requests (user_id, created_at DESC);

-- 2. Tối ưu hóa kiểm tra phiếu yêu cầu đang ở trạng thái chờ duyệt (PENDING) của người dùng
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_pending
    ON verification_requests (user_id)
    WHERE status = 'PENDING';

-- 3. Bổ sung loại thông báo ALUMNI_VERIFICATION gửi cho Sinh viên khi yêu cầu nâng cấp Cựu sinh viên được duyệt hoặc từ chối
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS ck_notifications_type;
ALTER TABLE notifications ADD CONSTRAINT ck_notifications_type CHECK (type IN (
    'POST_LIKE', 'POST_COMMENT', 'USER_FOLLOW', 'FORUM_ANSWER', 'REPORT_RESOLVED',
    'WELCOME', 'SYSTEM_BROADCAST', 'MENTORING_REQUEST', 'MENTORING_WORK_LOG',
    'MENTORING_TASK', 'MENTORING_GROUP', 'MENTORING_ACCOUNT', 'CONTENT_MODERATED',
    'ALUMNI_VERIFICATION'
));

