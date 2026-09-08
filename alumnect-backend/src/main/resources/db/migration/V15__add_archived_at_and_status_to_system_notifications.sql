-- ============================================================================
-- V15: Thêm archived_at và mở rộng các trạng thái cho system_notifications
-- Phục vụ: Scheduling, Expiration & Archive độc lập
-- ============================================================================

-- 1. Thêm cột archived_at vào bảng system_notifications
ALTER TABLE system_notifications ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 2. Cập nhật check constraint của status để hỗ trợ SENDING và ARCHIVED
ALTER TABLE system_notifications DROP CONSTRAINT IF EXISTS ck_system_notif_status;
ALTER TABLE system_notifications ADD CONSTRAINT ck_system_notif_status 
    CHECK (status IN ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'ACTIVE', 'EXPIRED', 'ARCHIVED', 'CANCELLED'));

-- 3. Cập nhật check constraint của duration_type để hỗ trợ CUSTOM
ALTER TABLE system_notifications DROP CONSTRAINT IF EXISTS ck_system_notif_duration;
ALTER TABLE system_notifications ADD CONSTRAINT ck_system_notif_duration 
    CHECK (duration_type IN ('ONE_DAY', 'ONE_WEEK', 'ONE_MONTH', 'ONE_YEAR', 'FOREVER', 'CUSTOM'));

-- 4. Tạo index tối ưu cho việc truy vấn theo trạng thái và thời gian lưu trữ
CREATE INDEX IF NOT EXISTS idx_sys_notif_archived_at ON system_notifications (archived_at);
