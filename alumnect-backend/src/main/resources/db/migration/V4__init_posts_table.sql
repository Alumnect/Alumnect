-- =====================================================================
-- AlumNect (ACCP) — UC15: View community Feed
-- Bảng posts — bài viết trên bảng tin cộng đồng.
-- Lưu ý: UC "Tạo bài viết" chưa nằm trong phạm vi, nên migration này
-- KHÔNG seed dữ liệu mẫu (mọi post đều gắn với 1 user_id có thật).
-- =====================================================================

-- 1) TABLE --------------------------------------------------------------

-- posts: Bài viết trên bảng tin cộng đồng (UC15 - View community Feed).
CREATE TABLE posts (
    id             BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        BIGINT        NOT NULL,
    type           VARCHAR(20)   NOT NULL DEFAULT 'NORMAL',
    content        TEXT          NOT NULL,
    image_url      VARCHAR(500),
    visibility     VARCHAR(20)   NOT NULL DEFAULT 'PUBLIC',
    like_count     INTEGER       NOT NULL DEFAULT 0,
    comment_count  INTEGER       NOT NULL DEFAULT 0,
    repost_count   INTEGER       NOT NULL DEFAULT 0,
    is_hidden      BOOLEAN       NOT NULL DEFAULT false,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_posts_type CHECK (type IN ('NORMAL', 'ACHIEVEMENT', 'RECRUITMENT', 'EVENT')),
    CONSTRAINT ck_posts_visibility CHECK (visibility IN ('PUBLIC', 'MEMBERS'))
);

-- 2) FOREIGN KEYS ---------------------------------------------------------

ALTER TABLE posts ADD CONSTRAINT fk_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3) INDEXES --------------------------------------------------------------

CREATE INDEX idx_posts_user_id ON posts (user_id);
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX idx_posts_type ON posts (type);
CREATE INDEX idx_posts_visibility_is_hidden ON posts (visibility, is_hidden);
