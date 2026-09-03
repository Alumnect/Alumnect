-- V7: Votes (Bình chọn câu hỏi/câu trả lời trên diễn đàn Q&A - UC42 Vote on a question)

CREATE TABLE votes (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(10) NOT NULL,
    target_id   BIGINT      NOT NULL,
    value       SMALLINT    NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_votes_user_target UNIQUE (user_id, target_type, target_id),
    CONSTRAINT ck_votes_value CHECK (value IN (-1, 1)),
    CONSTRAINT ck_votes_target_type CHECK (target_type IN ('QUESTION', 'ANSWER'))
);

CREATE INDEX idx_votes_target_type_target_id ON votes (target_type, target_id);
