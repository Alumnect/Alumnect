-- =====================================================================
-- Migration V3: Add Performance Indexes for Connection Suggestions (UC10)
-- Target DBMS: PostgreSQL 14+
-- =====================================================================

-- Chỉ mục kết hợp hỗ trợ tìm kiếm nhanh thành viên cùng chuyên ngành và cùng niên khóa
CREATE INDEX IF NOT EXISTS idx_user_profiles_major_cohort ON user_profiles(major_id, cohort);

-- Chỉ mục hỗ trợ truy vấn danh sách người dùng đang theo dõi (tránh gợi ý trùng lặp)
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);

-- Chỉ mục hỗ trợ truy vấn và đếm số lượng người theo dõi (tính điểm độ nổi bật)
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
