-- =====================================================================
-- AlumNect (ACCP)
-- V15: Align posts schema with Database Alumnect.sql
-- =====================================================================

-- 1. Đổi tên user_id thành author_id, xóa constraint cũ và thêm constraint mới
ALTER TABLE posts DROP CONSTRAINT fk_posts_user_id;
ALTER TABLE posts RENAME COLUMN user_id TO author_id;
ALTER TABLE posts ADD CONSTRAINT fk_posts_author_id FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. Đổi tên cột type thành category, và đổi các enum value
ALTER TABLE posts DROP CONSTRAINT ck_posts_type;
ALTER TABLE posts RENAME COLUMN type TO category;
-- Đổi NORMAL thành GENERAL
UPDATE posts SET category = 'GENERAL' WHERE category = 'NORMAL';
ALTER TABLE posts ADD CONSTRAINT ck_posts_category CHECK (category IN ('ACHIEVEMENT', 'GENERAL', 'EVENT', 'RECRUITMENT'));
ALTER TABLE posts ALTER COLUMN category SET DEFAULT 'GENERAL';

-- 3. Xử lý visibility và is_hidden thành status
ALTER TABLE posts DROP CONSTRAINT ck_posts_visibility;
ALTER TABLE posts ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
-- Migrate logic cũ: nếu is_hidden = true -> HIDDEN
UPDATE posts SET status = 'HIDDEN' WHERE is_hidden = true;
ALTER TABLE posts ADD CONSTRAINT ck_posts_status CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED'));
ALTER TABLE posts DROP COLUMN visibility;
ALTER TABLE posts DROP COLUMN is_hidden;

-- 4. Thêm các cột cho Event và Job (tạm thời nullable)
ALTER TABLE posts ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN pinned_at TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN repost_of_id BIGINT;
ALTER TABLE posts ADD COLUMN event_id BIGINT;
ALTER TABLE posts ADD COLUMN job_id BIGINT;

-- 5. Bảng post_media để lưu ảnh/video
CREATE TABLE post_media (
    id          BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id     BIGINT        NOT NULL,
    media_type  VARCHAR(10)   NOT NULL DEFAULT 'IMAGE',
    url         VARCHAR(500)  NOT NULL,
    sort_order  SMALLINT      NOT NULL DEFAULT 0,
    CONSTRAINT ck_post_media_media_type CHECK (media_type IN ('IMAGE', 'VIDEO')),
    CONSTRAINT fk_post_media_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Copy image_url từ bảng posts sang post_media (nếu có)
INSERT INTO post_media (post_id, url)
SELECT id, image_url
FROM posts
WHERE image_url IS NOT NULL;

-- Xóa cột image_url khỏi bảng posts
ALTER TABLE posts DROP COLUMN image_url;
