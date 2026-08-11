-- =====================================================================
-- AlumNect (ACCP) — UC38: View question list (Module 4 - Q&A Forum)
-- Bảng forum_topics (chủ đề Q&A) + questions (câu hỏi diễn đàn).
-- Lưu ý phạm vi: UC38 chỉ XEM danh sách câu hỏi, nên migration này
--   - CÓ seed forum_topics (đây là bảng danh mục/catalog, giống majors/roles).
--   - KHÔNG seed questions (mọi câu hỏi đều gắn với 1 author_id có thật).
-- =====================================================================

-- 1) TABLES -------------------------------------------------------------

-- forum_topics: Danh mục chủ đề của diễn đàn Q&A.
CREATE TABLE forum_topics (
    id           BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name         VARCHAR(120)  NOT NULL UNIQUE,
    description  VARCHAR(500),
    created_by   BIGINT,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- questions: Câu hỏi trên diễn đàn Q&A.
CREATE TABLE questions (
    id            BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    author_id     BIGINT        NOT NULL,
    topic_id      BIGINT,
    title         VARCHAR(250)  NOT NULL,
    body          TEXT          NOT NULL,
    status        VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    vote_count    INTEGER       NOT NULL DEFAULT 0,
    answer_count  INTEGER       NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_questions_status CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED'))
);

-- 2) SEED DATA FOR LOOKUP TABLE ---------------------------------------

-- forum_topics là danh mục dùng chung, seed sẵn để người dùng lọc câu hỏi theo chủ đề.
-- created_by để NULL vì đây là chủ đề mặc định của hệ thống, không thuộc user nào.
INSERT INTO forum_topics (name, description) VALUES
    ('Career',      'Định hướng nghề nghiệp, chuyển ngành, phát triển sự nghiệp'),
    ('Interview',   'Kinh nghiệm phỏng vấn, luyện thuật toán, system design'),
    ('Education',   'Học tập, chứng chỉ, học bổng, học lên cao'),
    ('Salary',      'Thảo luận về lương thưởng, đãi ngộ, thương lượng'),
    ('General',     'Các chủ đề chung khác của cộng đồng cựu sinh viên');

-- 3) FOREIGN KEYS -------------------------------------------------------

ALTER TABLE forum_topics ADD CONSTRAINT fk_forum_topics_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE questions ADD CONSTRAINT fk_questions_author_id FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE questions ADD CONSTRAINT fk_questions_topic_id FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE SET NULL;

-- 4) INDEXES ------------------------------------------------------------

CREATE INDEX idx_questions_author_id ON questions (author_id);
CREATE INDEX idx_questions_topic_id ON questions (topic_id);
CREATE INDEX idx_questions_created_at ON questions (created_at DESC);
CREATE INDEX idx_questions_status ON questions (status);
