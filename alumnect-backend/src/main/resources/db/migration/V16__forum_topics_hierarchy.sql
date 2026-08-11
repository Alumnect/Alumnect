-- UC40: Split question classification into two independent dimensions:
--   * topic_id: discussion category from forum_topics
--   * major_id: academic major from majors

ALTER TABLE questions ADD COLUMN major_id BIGINT;

ALTER TABLE questions ADD CONSTRAINT fk_questions_major_id
    FOREIGN KEY (major_id) REFERENCES majors (id) ON DELETE SET NULL;

CREATE INDEX idx_questions_major_id ON questions (major_id);
