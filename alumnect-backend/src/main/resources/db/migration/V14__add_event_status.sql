-- V14: Thêm trạng thái sự kiện (UC27 - Cancel an event)

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_events_status'
    ) THEN
        ALTER TABLE events
            ADD CONSTRAINT ck_events_status CHECK (status IN ('ACTIVE', 'CANCELLED'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
