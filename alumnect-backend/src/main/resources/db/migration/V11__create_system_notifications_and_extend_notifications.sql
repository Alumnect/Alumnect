-- ============================================================================
-- V15: Tạo bảng lưu trữ thông báo hệ thống của Admin (system_notifications)
-- và mở rộng bảng notifications (thêm expires_at, system_notification_id, SYSTEM_BROADCAST)
-- ============================================================================

-- 1. Tạo bảng system_notifications
CREATE TABLE system_notifications (
    id                  BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title               VARCHAR(255)  NOT NULL,
    content             TEXT          NOT NULL,
    recipient_type      VARCHAR(50)   NOT NULL, -- 'SPECIFIC_USER', 'USER_ROLE', 'ALL_USERS'
    recipient_role      VARCHAR(50),            -- 'STUDENT', 'ALUMNI', 'ADMIN'
    recipient_user_id   BIGINT,                 -- FK to users(id)
    status              VARCHAR(50)   NOT NULL DEFAULT 'DRAFT', -- 'SCHEDULED', 'SENT', 'ACTIVE', 'EXPIRED', 'CANCELLED'
    duration_type       VARCHAR(50)   NOT NULL, -- 'ONE_DAY', 'ONE_WEEK', 'ONE_MONTH', 'ONE_YEAR', 'FOREVER'
    scheduled_at        TIMESTAMPTZ,
    sent_at             TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    created_by          BIGINT        NOT NULL, -- FK to users(id)
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_system_notif_recipient_type CHECK (recipient_type IN ('SPECIFIC_USER', 'USER_ROLE', 'ALL_USERS')),
    CONSTRAINT ck_system_notif_status CHECK (status IN ('DRAFT', 'SCHEDULED', 'SENT', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
    CONSTRAINT ck_system_notif_duration CHECK (duration_type IN ('ONE_DAY', 'ONE_WEEK', 'ONE_MONTH', 'ONE_YEAR', 'FOREVER'))
);

-- Khóa ngoại cho system_notifications
ALTER TABLE system_notifications ADD CONSTRAINT fk_sys_notif_recipient_user FOREIGN KEY (recipient_user_id) REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE system_notifications ADD CONSTRAINT fk_sys_notif_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE;

-- Chỉ mục tối ưu cho system_notifications
CREATE INDEX idx_sys_notif_created_at ON system_notifications (created_at DESC);
CREATE INDEX idx_sys_notif_status ON system_notifications (status);
CREATE INDEX idx_sys_notif_scheduled ON system_notifications (status, scheduled_at);
CREATE INDEX idx_sys_notif_expires ON system_notifications (status, expires_at);

-- 2. Mở rộng bảng notifications hiện có
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS system_notification_id BIGINT;

ALTER TABLE notifications ADD CONSTRAINT fk_notifications_sys_notif FOREIGN KEY (system_notification_id) REFERENCES system_notifications (id) ON DELETE CASCADE;

-- Cập nhật check constraint của type trong bảng notifications để chấp nhận SYSTEM_BROADCAST
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS ck_notifications_type;
ALTER TABLE notifications ADD CONSTRAINT ck_notifications_type CHECK (type IN ('POST_LIKE', 'POST_COMMENT', 'USER_FOLLOW', 'FORUM_ANSWER', 'REPORT_RESOLVED', 'WELCOME', 'SYSTEM_BROADCAST'));

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_expires ON notifications (recipient_id, expires_at);
