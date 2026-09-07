-- V12: Event Registrations (Đăng ký tham gia sự kiện - UC25 Register to attend an event RSVP)

CREATE TABLE event_registrations (
    id         BIGSERIAL   PRIMARY KEY,
    event_id   BIGINT      NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_event_registrations_event_user UNIQUE (event_id, user_id),
    CONSTRAINT ck_event_registrations_status CHECK (status IN ('REGISTERED', 'CANCELLED'))
);

CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations(user_id);
