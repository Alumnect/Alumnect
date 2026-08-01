-- =====================================================================
-- AlumNect — PostgreSQL schema V13: follows relationship
-- =====================================================================

CREATE TABLE follows (
    id            BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    follower_id   BIGINT       NOT NULL,
    following_id  BIGINT       NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_follows_follower_id_following_id UNIQUE (follower_id, following_id),
    CONSTRAINT ck_follows_1 CHECK (follower_id <> following_id)
);

-- Đặt FOREIGN KEY ở cuối file
ALTER TABLE follows ADD CONSTRAINT fk_follows_follower_id FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE follows ADD CONSTRAINT fk_follows_following_id FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE;

-- Tạo các INDEX cho khóa ngoại để tối ưu truy vấn
CREATE INDEX idx_follows_follower_id ON follows (follower_id);
CREATE INDEX idx_follows_following_id ON follows (following_id);
