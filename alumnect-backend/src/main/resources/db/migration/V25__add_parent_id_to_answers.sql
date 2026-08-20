-- V25: Cho phép TRẢ LỜI LỒNG NHAU (reply) dưới một câu trả lời (UC48 mở rộng - reply to a comment).
--
-- Thêm cột parent_id tự tham chiếu vào bảng answers: NULL = câu trả lời gốc (top-level),
-- có giá trị = reply cho câu trả lời cha. Mô hình 2 cấp (câu trả lời → các reply).
-- Xóa câu trả lời cha thì các reply con bị xóa theo (CASCADE).

ALTER TABLE answers ADD COLUMN parent_id BIGINT;

ALTER TABLE answers ADD CONSTRAINT fk_answers_parent_id
    FOREIGN KEY (parent_id) REFERENCES answers (id) ON DELETE CASCADE;

CREATE INDEX idx_answers_parent_id ON answers (parent_id);
