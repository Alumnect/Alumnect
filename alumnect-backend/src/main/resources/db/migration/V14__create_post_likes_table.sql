-- =====================================================================
-- AlumNect (ACCP) — UC17: Like a post
-- Bảng post_likes — lưu lượt "thích" của người dùng cho từng bài viết.
-- Ràng buộc UNIQUE (post_id, user_id) đảm bảo mỗi người chỉ thích 1 lần / bài;
-- bộ đếm like_count (denormalized) trên bảng posts được cập nhật đồng thời ở tầng Service.
-- (V13 đã được thành viên khác sử dụng nên UC17 dùng V14.)
-- =====================================================================

-- 1) TABLE --------------------------------------------------------------

CREATE TABLE post_likes (
    id          BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id     BIGINT        NOT NULL,
    user_id     BIGINT        NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_post_likes_post_user UNIQUE (post_id, user_id)
);

-- 2) FOREIGN KEYS ---------------------------------------------------------

ALTER TABLE post_likes ADD CONSTRAINT fk_post_likes_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE post_likes ADD CONSTRAINT fk_post_likes_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3) INDEXES --------------------------------------------------------------

CREATE INDEX idx_post_likes_user_id ON post_likes (user_id);
CREATE INDEX idx_post_likes_post_id ON post_likes (post_id);
