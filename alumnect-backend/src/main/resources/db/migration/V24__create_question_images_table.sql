-- V24: Cho phép câu hỏi diễn đàn đính kèm nhiều ẢNH (UC40 mở rộng + UC46 - Edit a question).
--
-- Mỗi câu hỏi có thể đính kèm nhiều ảnh minh hoạ (VD ảnh chụp màn hình lỗi). Lưu ở bảng riêng
-- question_images (mô phỏng post_media của bài đăng) để dễ thêm/bớt/sắp thứ tự khi tạo hoặc sửa câu hỏi.

CREATE TABLE question_images (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    question_id BIGINT       NOT NULL,
    url         VARCHAR(500) NOT NULL,
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_question_images_question_id FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
);

CREATE INDEX idx_question_images_question_id ON question_images (question_id);
