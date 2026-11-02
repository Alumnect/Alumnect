-- V14: Xóa cột years_of_experience và ràng buộc liên quan khỏi bảng mentor_profiles (UC91)
ALTER TABLE mentor_profiles DROP CONSTRAINT IF EXISTS ck_mentor_profiles_years_exp;
ALTER TABLE mentor_profiles DROP COLUMN IF EXISTS years_of_experience;
