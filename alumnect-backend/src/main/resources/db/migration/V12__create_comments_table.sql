-- =====================================================================
-- AlumNect (ACCP) — UC16: View Post Detail
-- Bảng comments — bình luận của một bài viết (post detail comment thread).
-- Phạm vi UC16 chỉ ĐỌC bình luận (GET /posts/{id}/comments); việc đăng/sửa/xóa
-- bình luận thuộc UC18 "Manage Comments" và sẽ dùng lại chính bảng này.
--
-- Lưu ý đánh số migration: nhánh UC15 mới có tới V4, nhưng nhánh dev đã dùng tới
-- V11 (forum/oauth/admin...). Migration này đánh số V12 để khi gộp về dev KHÔNG
-- trùng version với V5–V11 sẵn có trên dev.
-- =====================================================================

-- 1) TABLE --------------------------------------------------------------

-- comments: Bình luận trên một bài viết. Hỗ trợ 1 cấp trả lời qua parent_comment_id.
-- Xóa mềm (soft delete) qua cột status = 'DELETED' (BR-11), không xóa cứng dữ liệu.
CREATE TABLE comments (
    id                 BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id            BIGINT        NOT NULL,
    user_id            BIGINT        NOT NULL,
    parent_comment_id  BIGINT,
    content            TEXT          NOT NULL,
    status             VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_comments_status CHECK (status IN ('ACTIVE', 'DELETED'))
);

-- 2) FOREIGN KEYS ---------------------------------------------------------

ALTER TABLE comments ADD CONSTRAINT fk_comments_post_id
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE comments ADD CONSTRAINT fk_comments_user_id
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- Tự tham chiếu để hỗ trợ 1 cấp trả lời; xóa comment cha sẽ xóa luôn các trả lời.
ALTER TABLE comments ADD CONSTRAINT fk_comments_parent_id
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE;

-- 3) INDEXES --------------------------------------------------------------

-- Truy vấn chính của UC16: lấy bình luận ACTIVE của 1 bài, sắp theo thời gian.
CREATE INDEX idx_comments_post_id_status ON comments (post_id, status, created_at);
CREATE INDEX idx_comments_user_id ON comments (user_id);
CREATE INDEX idx_comments_parent_id ON comments (parent_comment_id);