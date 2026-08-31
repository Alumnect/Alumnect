CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason VARCHAR(30) NOT NULL,
    description VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT ck_reports_reason
        CHECK (reason IN ('SPAM', 'INAPPROPRIATE', 'MISINFORMATION', 'SCAM_OR_FRAUD', 'OTHER')),
    CONSTRAINT ck_reports_status
        CHECK (status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
    CONSTRAINT ck_reports_other_description
        CHECK (reason <> 'OTHER' OR description IS NOT NULL AND char_length(trim(description)) > 0)
);

CREATE INDEX idx_reports_post_id ON reports(post_id);
CREATE INDEX idx_reports_reporter_id_created_at ON reports(reporter_id, created_at DESC);
