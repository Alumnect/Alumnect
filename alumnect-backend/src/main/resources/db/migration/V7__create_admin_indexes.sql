-- =====================================================================
-- AlumNect (ACCP) — PostgreSQL schema V4: Indexes for Admin Operations
-- =====================================================================

-- 1) INDEXES FOR USERS TABLE ------------------------------------------
CREATE INDEX idx_users_created_at ON users (created_at DESC);
CREATE INDEX idx_users_email_verified ON users (email_verified);
CREATE INDEX idx_users_is_account_verified ON users (is_account_verified);

-- 2) INDEXES FOR USER_PROFILES TABLE -----------------------------------
CREATE INDEX idx_user_profiles_full_name_lower ON user_profiles (LOWER(full_name));
CREATE INDEX idx_user_profiles_student_code_lower ON user_profiles (LOWER(student_code));
