-- =====================================================================
-- AlumNect Database Schema Migration - Version 5
-- Feature: Save Post / Bookmark Post (UC20)
-- Target DBMS: PostgreSQL 14+
-- =====================================================================

CREATE TABLE post_saves (
    id          BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id     BIGINT        NOT NULL,
    user_id     BIGINT        NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_post_saves_post_user UNIQUE (post_id, user_id)
);

-- Foreign Key Constraints
ALTER TABLE post_saves ADD CONSTRAINT fk_post_saves_post_id FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;
ALTER TABLE post_saves ADD CONSTRAINT fk_post_saves_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Performance Indexes
CREATE INDEX idx_post_saves_user_id ON post_saves (user_id);
CREATE INDEX idx_post_saves_post_id ON post_saves (post_id);
CREATE INDEX idx_post_saves_user_created_at ON post_saves (user_id, created_at DESC);
