-- ==============================================================================
-- AlumNect Database Migration - Version 16
-- Feature: UC98 - Tìm kiếm & Lọc Mentor (Search & Filter Mentors)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- 1. Index hỗ trợ lọc nhanh hình thức và loại hình cố vấn của Mentor
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_working_mode ON mentor_profiles(working_mode);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_mentoring_type ON mentor_profiles(mentoring_type);

-- 2. Composite index tối ưu hóa truy vấn lọc Mentor ACTIVE theo hình thức và loại hình cố vấn
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_search_composite ON mentor_profiles(mentor_status, working_mode, mentoring_type);

-- 3. Index hỗ trợ tìm kiếm theo chủ đề cố vấn (topic_name)
CREATE INDEX IF NOT EXISTS idx_mentor_topics_topic_name ON mentor_topics(topic_name);
