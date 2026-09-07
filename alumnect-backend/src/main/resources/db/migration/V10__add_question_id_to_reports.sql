-- Migration V10: Bổ sung cột question_id vào bảng reports phục vụ báo cáo câu hỏi vi phạm (UC78)
-- Cho phép post_id có thể NULL và ràng buộc duy nhất 1 đối tượng được báo cáo (post hoặc question)

ALTER TABLE reports ALTER COLUMN post_id DROP NOT NULL;

ALTER TABLE reports ADD COLUMN question_id BIGINT;

ALTER TABLE reports ADD CONSTRAINT fk_reports_question_id
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

CREATE INDEX idx_reports_question_id ON reports(question_id);

ALTER TABLE reports ADD CONSTRAINT ck_reports_target
    CHECK ((post_id IS NOT NULL AND question_id IS NULL) OR (post_id IS NULL AND question_id IS NOT NULL));
