-- =====================================================================
-- Migration V6: Add index for repost_of_id to optimize repost queries
-- Target DBMS: PostgreSQL
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_posts_repost_of_id ON posts (repost_of_id);
