-- =====================================================================
-- Migration V2: Add Performance Indexes for User Search & Directory
-- Target DBMS: PostgreSQL 14+
-- =====================================================================

-- Chỉ mục hỗ trợ tìm kiếm và sắp xếp theo họ tên người dùng
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON user_profiles(full_name);

-- Chỉ mục hỗ trợ lọc theo niên khóa (khóa học)
CREATE INDEX IF NOT EXISTS idx_user_profiles_cohort ON user_profiles(cohort);

-- Chỉ mục hỗ trợ lọc theo tỉnh / thành phố
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles(city);

-- Chỉ mục hỗ trợ lọc và tìm kiếm theo công ty / nơi làm việc
CREATE INDEX IF NOT EXISTS idx_experiences_company ON experiences(company);

-- Chỉ mục hỗ trợ lọc và tìm kiếm theo chức danh / vị trí công việc
CREATE INDEX IF NOT EXISTS idx_experiences_title ON experiences(title);

-- Chỉ mục hỗ trợ tìm kiếm và lọc theo tên kỹ năng
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_name ON user_skills(skill_name);
