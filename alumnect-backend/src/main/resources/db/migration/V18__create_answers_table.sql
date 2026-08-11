-- =====================================================================
-- AlumNect (ACCP) — UC41: Answer a question (Module 4 - Q&A Forum)
-- Bảng answers (câu trả lời cho một câu hỏi trên diễn đàn Q&A).
-- Dựng theo đúng khuôn bảng questions (V5): trạng thái ACTIVE/HIDDEN/DELETED,
-- bộ đếm vote khởi tạo 0, gắn tác giả + câu hỏi.
-- Phạm vi UC41 chỉ TẠO/XEM câu trả lời nên không seed dữ liệu.
-- =====================================================================

-- 1) TABLE --------------------------------------------------------------
CREATE TABLE answers (
    id           BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_id  BIGINT       NOT NULL,
    author_id    BIGINT       NOT NULL,
    body         TEXT         NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    vote_count   INTEGER      NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_answers_status CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED'))
);

-- 2) FOREIGN KEYS -------------------------------------------------------
ALTER TABLE answers ADD CONSTRAINT fk_answers_question_id FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
ALTER TABLE answers ADD CONSTRAINT fk_answers_author_id   FOREIGN KEY (author_id)   REFERENCES users(id)     ON DELETE CASCADE;

-- 3) INDEXES ------------------------------------------------------------
CREATE INDEX idx_answers_question_id ON answers (question_id);
