-- Flyway Migration: Make student_code NOT NULL and UNIQUE in user_profiles

-- Cập nhật các dòng bị NULL bằng giá trị tạm thời duy nhất (TEMP_ + ID) để tránh lỗi khi đặt NOT NULL
UPDATE user_profiles 
SET student_code = 'TEMP_' || user_id 
WHERE student_code IS NULL;

-- Thực hiện thay đổi cấu trúc bảng
ALTER TABLE user_profiles ALTER COLUMN student_code SET NOT NULL;
ALTER TABLE user_profiles ADD CONSTRAINT uq_user_profiles_student_code UNIQUE (student_code);
