-- =====================================================================
-- AlumNect (ACCP) — PostgreSQL schema V5: Seed Test Users and Profiles
-- =====================================================================

-- 1) INSERT USERS -----------------------------------------------------
-- Mật khẩu mặc định của tất cả tài khoản test là "Password123!"
-- Hash: $2a$10$zzyitOxl6sXxoHT2zG7S9OL/OVthMSdC28X1DKJ.R6tLqx2284oLK

-- Admin
INSERT INTO users (email, password_hash, role_id, account_status, is_account_verified, email_verified, auth_provider)
VALUES ('admin@fpt.edu.vn', '$2a$10$zzyitOxl6sXxoHT2zG7S9OL/OVthMSdC28X1DKJ.R6tLqx2284oLK', 3, 'ACTIVE', true, true, 'LOCAL');

-- Sinh viên đang hoạt động
INSERT INTO users (email, password_hash, role_id, account_status, is_account_verified, email_verified, auth_provider)
VALUES ('sinhvien@fpt.edu.vn', '$2a$10$zzyitOxl6sXxoHT2zG7S9OL/OVthMSdC28X1DKJ.R6tLqx2284oLK', 1, 'ACTIVE', true, true, 'LOCAL');

-- Sinh viên bị khóa
INSERT INTO users (email, password_hash, role_id, account_status, is_account_verified, email_verified, auth_provider)
VALUES ('locked_student@fpt.edu.vn', '$2a$10$zzyitOxl6sXxoHT2zG7S9OL/OVthMSdC28X1DKJ.R6tLqx2284oLK', 1, 'LOCKED', true, true, 'LOCAL');

-- Cựu sinh viên đã phê duyệt
INSERT INTO users (email, password_hash, role_id, account_status, is_account_verified, email_verified, auth_provider)
VALUES ('alumni1@fpt.edu.vn', '$2a$10$zzyitOxl6sXxoHT2zG7S9OL/OVthMSdC28X1DKJ.R6tLqx2284oLK', 2, 'ACTIVE', true, true, 'LOCAL');

-- Cựu sinh viên đang chờ duyệt hồ sơ tốt nghiệp
INSERT INTO users (email, password_hash, role_id, account_status, is_account_verified, email_verified, auth_provider)
VALUES ('alumni_test@gmail.com', '$2a$10$zzyitOxl6sXxoHT2zG7S9OL/OVthMSdC28X1DKJ.R6tLqx2284oLK', 2, 'WAITING_APPROVAL', false, true, 'LOCAL');


-- 2) INSERT USER PROFILES ---------------------------------------------

-- Profile Admin
INSERT INTO user_profiles (user_id, full_name, avatar_url, phone, major_id, cohort, student_code, headline)
VALUES (
    (SELECT id FROM users WHERE email = 'admin@fpt.edu.vn'),
    'Hệ thống Admin',
    'https://pub-2b36fb34f71a4f0b9bb859a0fa95616e.r2.dev/alumnect/avatar_default.png',
    '0999999999',
    1,
    18,
    'ADMIN01',
    'Quản trị viên hệ thống AlumNect'
);

-- Profile Sinh viên hoạt động
INSERT INTO user_profiles (user_id, full_name, avatar_url, phone, major_id, cohort, student_code, headline)
VALUES (
    (SELECT id FROM users WHERE email = 'sinhvien@fpt.edu.vn'),
    'Nguyễn Văn Sinh Viên',
    'https://pub-2b36fb34f71a4f0b9bb859a0fa95616e.r2.dev/alumnect/avatar_default.png',
    '0988888888',
    1,
    18,
    'HE180001',
    'Sinh viên Kỹ thuật phần mềm K18'
);

-- Profile Sinh viên bị khóa
INSERT INTO user_profiles (user_id, full_name, avatar_url, phone, major_id, cohort, student_code, headline)
VALUES (
    (SELECT id FROM users WHERE email = 'locked_student@fpt.edu.vn'),
    'Sinh Viên Bị Khóa',
    'https://pub-2b36fb34f71a4f0b9bb859a0fa95616e.r2.dev/alumnect/avatar_default.png',
    '0977777777',
    2,
    17,
    'HE170002',
    'Tài khoản vi phạm quy chuẩn cộng đồng'
);

-- Profile Cựu sinh viên hoạt động
INSERT INTO user_profiles (user_id, full_name, avatar_url, phone, major_id, cohort, student_code, headline, current_position, current_company)
VALUES (
    (SELECT id FROM users WHERE email = 'alumni1@fpt.edu.vn'),
    'Trần Văn Cựu Sinh Viên',
    'https://pub-2b36fb34f71a4f0b9bb859a0fa95616e.r2.dev/alumnect/avatar_default.png',
    '0966666666',
    1,
    14,
    'HE140003',
    'Backend Engineer tại FPT Software',
    'Backend Developer',
    'FPT Software'
);

-- Profile Cựu sinh viên chờ duyệt
INSERT INTO user_profiles (user_id, full_name, avatar_url, phone, major_id, cohort, student_code, headline)
VALUES (
    (SELECT id FROM users WHERE email = 'alumni_test@gmail.com'),
    'Lê Văn Alumni Test',
    'https://pub-2b36fb34f71a4f0b9bb859a0fa95616e.r2.dev/alumnect/avatar_default.png',
    '0955555555',
    1,
    15,
    'HE150004',
    'Cựu sinh viên đang đợi kiểm duyệt tốt nghiệp'
);


-- 3) INSERT VERIFICATION REQUESTS -------------------------------------

-- Phiếu yêu cầu xác minh PENDING của alumni_test@gmail.com
INSERT INTO verification_requests (user_id, graduation_year, major_id, proof_url, note, status)
VALUES (
    (SELECT id FROM users WHERE email = 'alumni_test@gmail.com'),
    2023,
    1,
    'https://pub-2b36fb34f71a4f0b9bb859a0fa95616e.r2.dev/alumnect/proof_tot_nghiep.jpg',
    'Gửi admin phê duyệt bằng tốt nghiệp đại học FPT.',
    'PENDING'
);

-- Phiếu yêu cầu xác minh APPROVED của alumni1@fpt.edu.vn (Lưu vết lịch sử duyệt)
INSERT INTO verification_requests (user_id, graduation_year, major_id, proof_url, note, status, reviewed_by, review_note, reviewed_at)
VALUES (
    (SELECT id FROM users WHERE email = 'alumni1@fpt.edu.vn'),
    2022,
    1,
    'https://pub-2b36fb34f71a4f0b9bb859a0fa95616e.r2.dev/alumnect/proof_tot_nghiep.jpg',
    'Minh chứng tốt nghiệp ngành SE.',
    'APPROVED',
    (SELECT id FROM users WHERE email = 'admin@fpt.edu.vn'),
    'Hồ sơ hợp lệ, đã phê duyệt cựu sinh viên K14 SE.',
    now()
);


-- 4) INSERT USER SETTINGS ---------------------------------------------
INSERT INTO user_settings (user_id, theme, language)
VALUES 
((SELECT id FROM users WHERE email = 'admin@fpt.edu.vn'), 'SYSTEM', 'vi'),
((SELECT id FROM users WHERE email = 'sinhvien@fpt.edu.vn'), 'LIGHT', 'vi'),
((SELECT id FROM users WHERE email = 'locked_student@fpt.edu.vn'), 'LIGHT', 'vi'),
((SELECT id FROM users WHERE email = 'alumni1@fpt.edu.vn'), 'DARK', 'vi'),
((SELECT id FROM users WHERE email = 'alumni_test@gmail.com'), 'LIGHT', 'vi');
