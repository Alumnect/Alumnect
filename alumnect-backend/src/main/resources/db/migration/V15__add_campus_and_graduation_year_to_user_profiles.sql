-- V15__add_campus_and_graduation_year_to_user_profiles.sql
-- Thêm cột campus (Cơ sở FPT University) và graduation_year (Năm tốt nghiệp / dự kiến tốt nghiệp) vào bảng user_profiles

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS campus VARCHAR(80);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS graduation_year INTEGER;
