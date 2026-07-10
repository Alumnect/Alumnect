-- V11__extend_experiences_table.sql

-- 1. Add new geocoding and tracking columns to experiences table
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS is_primary BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS place_id VARCHAR(255);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS location_city VARCHAR(120);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS location_country VARCHAR(120);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS location_country_code VARCHAR(10);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS geocoding_provider VARCHAR(50);
ALTER TABLE experiences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Data cleanup and constraints: Ensure start_date <= end_date or end_date is null
UPDATE experiences 
SET end_date = NULL 
WHERE is_current = TRUE;

UPDATE experiences 
SET end_date = start_date 
WHERE is_current = FALSE AND end_date IS NULL;

UPDATE experiences 
SET end_date = start_date 
WHERE end_date IS NOT NULL AND end_date < start_date;

-- 3. Match legacy user profile coordinate fields to experiences
DO $$
DECLARE
    r RECORD;
    matched_id BIGINT;
BEGIN
    FOR r IN 
        SELECT user_id, city, latitude, longitude 
        FROM user_profiles 
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    LOOP
        -- Find the primary current experience
        SELECT id INTO matched_id 
        FROM experiences 
        WHERE user_id = r.user_id 
          AND is_current = TRUE 
          AND is_primary = TRUE
        LIMIT 1;

        -- Fallback to the latest current experience
        IF matched_id IS NULL THEN
            SELECT id INTO matched_id 
            FROM experiences 
            WHERE user_id = r.user_id 
              AND is_current = TRUE 
            ORDER BY start_date DESC
            LIMIT 1;
        END IF;

        IF matched_id IS NOT NULL THEN
            UPDATE experiences 
            SET latitude = r.latitude,
                longitude = r.longitude,
                location_city = r.city,
                geocoding_provider = 'LEGACY_MIGRATION'
            WHERE id = matched_id;
        END IF;
    END LOOP;
END $$;

-- 4. Auto-promote the latest remaining current experience of each user to primary = true
DO $$
DECLARE
    u RECORD;
    latest_current_id BIGINT;
BEGIN
    FOR u IN 
        SELECT DISTINCT user_id 
        FROM experiences 
        WHERE is_current = TRUE
    LOOP
        -- Check if user already has a primary current experience
        IF NOT EXISTS (
            SELECT 1 
            FROM experiences 
            WHERE user_id = u.user_id AND is_current = TRUE AND is_primary = TRUE
        ) THEN
            -- Find the latest current experience
            SELECT id INTO latest_current_id 
            FROM experiences 
            WHERE user_id = u.user_id AND is_current = TRUE 
            ORDER BY start_date DESC 
            LIMIT 1;
            
            IF latest_current_id IS NOT NULL THEN
                UPDATE experiences 
                SET is_primary = TRUE 
                WHERE id = latest_current_id;
            END IF;
        END IF;
    END LOOP;
END $$;

-- 5. Add constraints and indexes (Use DROP CONSTRAINT IF EXISTS for clean reruns)
ALTER TABLE experiences DROP CONSTRAINT IF EXISTS chk_experience_coordinates;
ALTER TABLE experiences ADD CONSTRAINT chk_experience_coordinates 
    CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL));

ALTER TABLE experiences DROP CONSTRAINT IF EXISTS chk_experience_latitude_range;
ALTER TABLE experiences ADD CONSTRAINT chk_experience_latitude_range 
    CHECK (latitude >= -90.0 AND latitude <= 90.0);

ALTER TABLE experiences DROP CONSTRAINT IF EXISTS chk_experience_longitude_range;
ALTER TABLE experiences ADD CONSTRAINT chk_experience_longitude_range 
    CHECK (longitude >= -180.0 AND longitude <= 180.0);

-- Partial unique index to enforce at most one primary experience per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_experiences_user_primary_current 
    ON experiences (user_id) 
    WHERE (is_current = TRUE AND is_primary = TRUE);

-- 6. Seed test user with 10 experiences spanning 5 years
-- Insert User (local auth provider, role ALUMNI, active status)
INSERT INTO users (email, password_hash, role_id, account_status, is_account_verified, email_verified, auth_provider)
VALUES (
    'career.explorer@fpt.edu.vn',
    '$2a$10$8.t1s9k8W.1vFh0N/1Vl9.Vz03.tC0t9P8r1Zc9H.Tq0VbM6X2L2e', -- bcrypt for 'password123'
    (SELECT id FROM roles WHERE name = 'ALUMNI' LIMIT 1),
    'ACTIVE',
    true,
    true,
    'LOCAL'
) ON CONFLICT (email) DO NOTHING;

-- Link profile + experiences to the generated user
DO $$
DECLARE
    new_user_id BIGINT;
    se_major_id BIGINT;
BEGIN
    SELECT id INTO new_user_id FROM users WHERE email = 'career.explorer@fpt.edu.vn';
    SELECT id INTO se_major_id FROM majors LIMIT 1; -- Pick the first available major

    -- Clean up existing profile and experiences for this test user if they already exist to allow clean reruns
    DELETE FROM experiences WHERE user_id = new_user_id;
    DELETE FROM user_profiles WHERE user_id = new_user_id;

    -- Insert User Profile with location Da Nang
    INSERT INTO user_profiles (user_id, full_name, avatar_url, phone, major_id, cohort, student_code, headline, biography, city, latitude, longitude)
    VALUES (
        new_user_id,
        'Nguyễn Trí Tuệ',
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150',
        '0905123456',
        se_major_id,
        15,
        'DE150000',
        'Vice President of Engineering tại mgm technology partners',
        'Lộ trình sự nghiệp 5 năm từ Junior Developer đến VP of Engineering. Hiện đang quản lý mgm Đà Nẵng và làm chuyên gia tư vấn remote cho tập đoàn Turing Mỹ.',
        'Đà Nẵng',
        16.054400,
        108.202200
    );

    -- Insert 10 Experiences spanning from 5 years ago (2021) to today
    -- 1. Junior Software Engineer at FPT Software (2021)
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description)
    VALUES (new_user_id, 'Junior Software Engineer', 'FPT Software', 'Đà Nẵng, Việt Nam', '2021-03-01', '2021-12-31', false, false, 16.054400, 108.202200, 'Đà Nẵng', 'Việt Nam', 'VN', 'MAPTILER', 'Làm việc trong dự án phát triển hệ thống quản lý nhân sự.');

    -- 2. Software Engineer at FPT Software (2022)
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description)
    VALUES (new_user_id, 'Software Engineer', 'FPT Software', 'Đà Nẵng, Việt Nam', '2022-01-01', '2022-08-31', false, false, 16.054400, 108.202200, 'Đà Nẵng', 'Việt Nam', 'VN', 'MAPTILER', 'Phát triển backend sử dụng Spring Boot và microservices.');

    -- 3. Senior Software Engineer at FPT Software (2022)
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description)
    VALUES (new_user_id, 'Senior Software Engineer', 'FPT Software', 'Đà Nẵng, Việt Nam', '2022-09-01', '2023-04-30', false, false, 16.054400, 108.202200, 'Đà Nẵng', 'Việt Nam', 'VN', 'MAPTILER', 'Làm lead một nhóm nhỏ, tối ưu hiệu năng cơ sở dữ liệu và thiết kế kiến trúc.');

    -- 4. Technical Lead at FPT Software (2023)
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description)
    VALUES (new_user_id, 'Technical Lead', 'FPT Software', 'Đà Nẵng, Việt Nam', '2023-05-01', '2023-11-30', false, false, 16.054400, 108.202200, 'Đà Nẵng', 'Việt Nam', 'VN', 'MAPTILER', 'Dẫn dắt dự án lớn cho khách hàng Nhật Bản, chịu trách nhiệm về chất lượng mã nguồn.');

    -- 5. Solutions Architect at FPT Software (2023-2024)
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description)
    VALUES (new_user_id, 'Solutions Architect', 'FPT Software', 'Đà Nẵng, Việt Nam', '2023-12-01', '2024-06-30', false, false, 16.054400, 108.202200, 'Đà Nẵng', 'Việt Nam', 'VN', 'MAPTILER', 'Thiết kế giải pháp Cloud trên AWS, làm việc trực tiếp với khách hàng Nhật và Âu Mỹ.');

    -- 6. Consultant at Enclave (2024)
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description)
    VALUES (new_user_id, 'Consultant', 'Enclave', 'Đà Nẵng, Việt Nam', '2024-07-01', '2024-11-30', false, false, 16.054400, 108.202200, 'Đà Nẵng', 'Việt Nam', 'VN', 'MAPTILER', 'Tư vấn quy trình phát triển phần mềm và tối ưu hóa tài nguyên hệ thống.');

    -- 7. Engineering Manager at Enclave (2024-2025)
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description)
    VALUES (new_user_id, 'Engineering Manager', 'Enclave', 'Đà Nẵng, Việt Nam', '2024-12-01', '2025-04-30', false, false, 16.054400, 108.202200, 'Đà Nẵng', 'Việt Nam', 'VN', 'MAPTILER', 'Quản lý phòng kỹ thuật phát triển sản phẩm gia công quy mô lớn.');

    -- 8. Director of Engineering at KMS Technology (2025)
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description)
    VALUES (new_user_id, 'Director of Engineering', 'KMS Technology', 'Đà Nẵng, Việt Nam', '2025-05-01', '2025-10-31', false, false, 16.054400, 108.202200, 'Đà Nẵng', 'Việt Nam', 'VN', 'MAPTILER', 'Quản lý chiến lược phân bổ công nghệ và quy chuẩn chất lượng chi nhánh miền Trung.');

    -- 9. CURRENT OFFLINE PRIMARY JOB: Vice President of Engineering at mgm technology partners (Đà Nẵng, offline)
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description)
    VALUES (new_user_id, 'Vice President of Engineering', 'mgm technology partners', 'Đà Nẵng, Việt Nam', '2025-11-01', NULL, true, true, 16.054400, 108.202200, 'Đà Nẵng', 'Việt Nam', 'VN', 'MAPTILER', 'Định hướng công nghệ toàn chi nhánh và điều hành làm việc trực tiếp tại văn phòng Đà Nẵng.');

    -- 10. CURRENT ONLINE REMOTE JOB: Senior Remote Consultant at Turing Inc. (Online, United States)
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description)
    VALUES (new_user_id, 'Senior Remote Consultant', 'Turing Inc.', 'Remote, USA', '2025-12-01', NULL, true, false, 37.774900, -122.419400, 'San Francisco', 'United States', 'US', 'MAPTILER', 'Làm việc online từ xa, thiết kế kiến trúc phân tán cho đối tác tại thung lũng Silicon Mỹ.');
END $$;
