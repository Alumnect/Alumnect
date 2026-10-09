-- =====================================================================
-- SEED DATA: 5 ALUMNI MẪU ĐẦY ĐỦ THÔNG TIN & CAREER PATH (3-4 EXPERIENCES)
-- Các tỉnh thành Việt Nam: Hà Nội, Đà Nẵng, TP. Hồ Chí Minh, Cần Thơ, Quy Nhơn
-- Mật khẩu chung cho cả 5 tài khoản: Password123@
SET client_encoding = 'UTF8';

DO $$
DECLARE
    v_role_alumni_id BIGINT;
    v_major_se_id    BIGINT;
    v_major_gd_id    BIGINT;
    v_major_ai_id    BIGINT;
    v_major_ia_id    BIGINT;
    v_major_ads_id   BIGINT;

    v_user1_id BIGINT;
    v_user2_id BIGINT;
    v_user3_id BIGINT;
    v_user4_id BIGINT;
    v_user5_id BIGINT;
BEGIN
    -- 1. Lấy ID của Role và Major tương ứng
    SELECT id INTO v_role_alumni_id FROM roles WHERE name = 'ALUMNI';
    IF v_role_alumni_id IS NULL THEN
        v_role_alumni_id := 2;
    END IF;

    SELECT id INTO v_major_se_id  FROM majors WHERE code = 'SE' LIMIT 1;
    SELECT id INTO v_major_gd_id  FROM majors WHERE code = 'GD' LIMIT 1;
    SELECT id INTO v_major_ai_id  FROM majors WHERE code = 'AI' LIMIT 1;
    SELECT id INTO v_major_ia_id  FROM majors WHERE code = 'IA' LIMIT 1;
    SELECT id INTO v_major_ads_id FROM majors WHERE code = 'ADS' LIMIT 1;

    -- Dự phòng nếu major chưa có
    IF v_major_se_id IS NULL THEN v_major_se_id := 1; END IF;
    IF v_major_ia_id IS NULL THEN v_major_ia_id := 2; END IF;
    IF v_major_ai_id IS NULL THEN v_major_ai_id := 3; END IF;
    IF v_major_ads_id IS NULL THEN v_major_ads_id := 6; END IF;
    IF v_major_gd_id IS NULL THEN v_major_gd_id := 7; END IF;

    -- =====================================================================
    -- 2. USER 1: Nguyễn Văn An (Hà Nội - Kỹ thuật phần mềm K13)
    -- =====================================================================
    INSERT INTO users (email, password_hash, role_id, auth_provider, account_status, email_verified, is_account_verified, last_login_at, created_at, updated_at)
    VALUES (
        'an.nguyen.alumni@fpt.edu.vn',
        '$2a$10$7EqJtq98hPqEX7fNZaFWoO9mQ6jK.1Hmsj88vXmFz5w/m6bY4Z0.6',
        v_role_alumni_id,
        'LOCAL',
        'ACTIVE',
        true,
        true,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET account_status = 'ACTIVE', is_account_verified = true
    RETURNING id INTO v_user1_id;

    -- Profile User 1
    INSERT INTO user_profiles (
        user_id, full_name, avatar_url, cover_url, phone, major_id, cohort, student_code,
        headline, biography, campus, graduation_year, city, social_links, created_at, updated_at
    ) VALUES (
        v_user1_id,
        'Nguyễn Văn An',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
        '0912345678',
        v_major_se_id,
        13,
        'SE130101',
        'Lead Backend Engineer tại Viettel Solutions | Cựu sinh viên K13 FPTU',
        'Kỹ sư phần mềm với hơn 4 năm kinh nghiệm xây dựng hệ thống phân tán chịu tải cao (High-load Distributed Systems). Đam mê Cloud Computing, Microservices và sẵn sàng hỗ trợ các bạn sinh viên FPT thế hệ sau.',
        'FPT University Hà Nội',
        2021,
        'Hà Nội',
        ARRAY['https://github.com/annguyen-dev', 'https://linkedin.com/in/annguyen-se'],
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        headline = EXCLUDED.headline,
        biography = EXCLUDED.biography,
        city = EXCLUDED.city,
        major_id = EXCLUDED.major_id;

    -- Xóa kinh nghiệm cũ nếu có để tránh trùng lặp
    DELETE FROM experiences WHERE user_id = v_user1_id;

    -- 4 Experiences (Career Path) cho User 1
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description, created_at, updated_at)
    VALUES
    (v_user1_id, 'Intern Java Developer', 'FPT Software Hà Nội', 'Tòa nhà Keangnam Landmark 72, Mễ Trì, Nam Từ Liêm, Hà Nội', '2020-06-01', '2020-12-31', false, false, 21.016944, 105.783889, 'Hà Nội', 'Việt Nam', 'VN', 'MAPTILER', 'Tham gia dự án On-the-job Training, phát triển RESTful API cho khách hàng logistics Nhật Bản bằng Spring Boot.', NOW(), NOW()),
    (v_user1_id, 'Junior Software Engineer', 'FPT Software Hà Nội', 'FPT Tower, 10 Phạm Văn Bạch, Cầu Giấy, Hà Nội', '2021-01-01', '2022-05-31', false, false, 21.028511, 105.783615, 'Hà Nội', 'Việt Nam', 'VN', 'MAPTILER', 'Chính thức vào dự án Fintech, tối ưu hóa cơ sở dữ liệu PostgreSQL và tích hợp cổng thanh toán.', NOW(), NOW()),
    (v_user1_id, 'Mid-level Backend Engineer', 'VNPay', 'Tòa nhà VNPAY, 22 Láng Hạ, Đống Đa, Hà Nội', '2022-06-01', '2023-08-31', false, false, 21.018611, 105.815278, 'Hà Nội', 'Việt Nam', 'VN', 'MAPTILER', 'Xây dựng core dịch vụ thanh toán QR code với Apache Kafka và Redis, đảm bảo 99.99% uptime.', NOW(), NOW()),
    (v_user1_id, 'Lead Backend Engineer', 'Viettel Solutions', 'Tòa nhà Viettel, Số 1 Trần Hữu Dực, Nam Từ Liêm, Hà Nội', '2023-09-01', NULL, true, true, 21.031389, 105.766111, 'Hà Nội', 'Việt Nam', 'VN', 'MAPTILER', 'Dẫn dắt đội ngũ kỹ sư 8 thành viên phát triển nền tảng Cloud và Smart City cho chính quyền điện tử.', NOW(), NOW());

    -- =====================================================================
    -- 2. USER 2: Trần Thị Mai Phương (Đà Nẵng - Thiết kế đồ họa K14)
    -- =====================================================================
    INSERT INTO users (email, password_hash, role_id, auth_provider, account_status, email_verified, is_account_verified, last_login_at, created_at, updated_at)
    VALUES (
        'phuong.tran.alumni@fpt.edu.vn',
        '$2a$10$7EqJtq98hPqEX7fNZaFWoO9mQ6jK.1Hmsj88vXmFz5w/m6bY4Z0.6',
        v_role_alumni_id,
        'LOCAL',
        'ACTIVE',
        true,
        true,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET account_status = 'ACTIVE', is_account_verified = true
    RETURNING id INTO v_user2_id;

    -- Profile User 2
    INSERT INTO user_profiles (
        user_id, full_name, avatar_url, cover_url, phone, major_id, cohort, student_code,
        headline, biography, campus, graduation_year, city, social_links, created_at, updated_at
    ) VALUES (
        v_user2_id,
        'Trần Thị Mai Phương',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
        '0905123456',
        v_major_gd_id,
        14,
        'GD140222',
        'Senior Product Designer tại FPT Software Đà Nẵng | UX/UI Design',
        'Nhà thiết kế sản phẩm số tập trung vào trải nghiệm người dùng, Design System và thiết kế tương tác. Từng mentor cho nhiều dự án Capstone của sinh viên FPTU Đà Nẵng.',
        'FPT University Đà Nẵng',
        2022,
        'Đà Nẵng',
        ARRAY['https://behance.net/maiphuong-design', 'https://linkedin.com/in/maiphuong-tran'],
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        headline = EXCLUDED.headline,
        biography = EXCLUDED.biography,
        city = EXCLUDED.city,
        major_id = EXCLUDED.major_id;

    DELETE FROM experiences WHERE user_id = v_user2_id;

    -- 3 Experiences (Career Path) cho User 2
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description, created_at, updated_at)
    VALUES
    (v_user2_id, 'UI/UX Design Intern', 'Enouvo IT Solutions', '15 Tạ Mỹ Duật, An Hải Bắc, Sơn Trà, Đà Nẵng', '2021-03-01', '2021-09-30', false, false, 16.069444, 108.236111, 'Đà Nẵng', 'Việt Nam', 'VN', 'MAPTILER', 'Thiết kế wireframe và prototype cho ứng dụng Smart Tourism tại Đà Nẵng.', NOW(), NOW()),
    (v_user2_id, 'UI Designer', 'BAP IT Co., Ltd', 'Tòa nhà Quảng Đà, 360 Nguyễn Tri Phương, Hải Châu, Đà Nẵng', '2021-10-01', '2022-12-31', false, false, 16.051111, 108.204444, 'Đà Nẵng', 'Việt Nam', 'VN', 'MAPTILER', 'Phát triển bộ Design System chuẩn hóa cho các dự án Web và Mobile phục vụ khách hàng Nhật.', NOW(), NOW()),
    (v_user2_id, 'Senior Product Designer', 'FPT Software Đà Nẵng', 'FPT Complex, Nam Kỳ Khởi Nghĩa, Hòa Hải, Ngũ Hành Sơn, Đà Nẵng', '2023-01-01', NULL, true, true, 15.986694, 108.261222, 'Đà Nẵng', 'Việt Nam', 'VN', 'MAPTILER', 'Phụ trách trải nghiệm người dùng cho hệ sinh thái phần mềm doanh nghiệp tại FPT Complex.', NOW(), NOW());

    -- =====================================================================
    -- 3. USER 3: Lê Hoàng Nam (Hồ Chí Minh - Trí tuệ nhân tạo K12)
    -- =====================================================================
    INSERT INTO users (email, password_hash, role_id, auth_provider, account_status, email_verified, is_account_verified, last_login_at, created_at, updated_at)
    VALUES (
        'nam.le.alumni@fpt.edu.vn',
        '$2a$10$7EqJtq98hPqEX7fNZaFWoO9mQ6jK.1Hmsj88vXmFz5w/m6bY4Z0.6',
        v_role_alumni_id,
        'LOCAL',
        'ACTIVE',
        true,
        true,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET account_status = 'ACTIVE', is_account_verified = true
    RETURNING id INTO v_user3_id;

    -- Profile User 3
    INSERT INTO user_profiles (
        user_id, full_name, avatar_url, cover_url, phone, major_id, cohort, student_code,
        headline, biography, campus, graduation_year, city, social_links, created_at, updated_at
    ) VALUES (
        v_user3_id,
        'Lê Hoàng Nam',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80',
        '0938999888',
        v_major_ai_id,
        12,
        'AI120333',
        'AI Research Lead tại VNG Corporation | Computer Vision & GenAI',
        'Chuyên gia AI & Deep Learning với hơn 5 năm kinh nghiệm nghiên cứu thị giác máy tính và các mô hình ngôn ngữ lớn (LLM). Thủ khoa tốt nghiệp ngành Trí tuệ nhân tạo FPTU.',
        'FPT University TP.HCM',
        2020,
        'Hồ Chí Minh',
        ARRAY['https://linkedin.com/in/namle-ai', 'https://github.com/namle-ai'],
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        headline = EXCLUDED.headline,
        biography = EXCLUDED.biography,
        city = EXCLUDED.city,
        major_id = EXCLUDED.major_id;

    DELETE FROM experiences WHERE user_id = v_user3_id;

    -- 4 Experiences (Career Path) cho User 3
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description, created_at, updated_at)
    VALUES
    (v_user3_id, 'AI Research Intern', 'Zalo AI Lab', 'VNG Campus, Lô Z06, Đường 13, Tân Thuận Đông, Quận 7, TP.HCM', '2019-01-01', '2019-08-31', false, false, 10.771512, 106.728956, 'Hồ Chí Minh', 'Việt Nam', 'VN', 'MAPTILER', 'Thực tập sinh nghiên cứu mô hình nhận diện giọng nói tiếng Việt và Speech-to-Text.', NOW(), NOW()),
    (v_user3_id, 'Computer Vision Engineer', 'VinAI Research', 'Vinhomes Central Park, 208 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM', '2019-09-01', '2021-12-31', false, false, 10.793889, 106.721667, 'Hồ Chí Minh', 'Việt Nam', 'VN', 'MAPTILER', 'Phát triển thuật toán nhận diện khuôn mặt và cảnh báo buồn ngủ cho hệ thống ô tô thông minh VinFast.', NOW(), NOW()),
    (v_user3_id, 'Senior ML Engineer', 'MoMo (M-Service)', 'Tòa nhà Phú Mỹ Hưng, Hoàng Văn Thái, Tân Phú, Quận 7, TP.HCM', '2022-01-01', '2023-04-30', false, false, 10.729167, 106.721944, 'Hồ Chí Minh', 'Việt Nam', 'VN', 'MAPTILER', 'Xây dựng hệ thống phát hiện gian lận giao dịch ví điện tử thời gian thực (Real-time Fraud Detection).', NOW(), NOW()),
    (v_user3_id, 'AI Research Lead', 'VNG Corporation', 'VNG Campus, Đường 13, Khu chế xuất Tân Thuận, Quận 7, TP.HCM', '2023-05-01', NULL, true, true, 10.771512, 106.728956, 'Hồ Chí Minh', 'Việt Nam', 'VN', 'MAPTILER', 'Trưởng nhóm nghiên cứu AI triển khai các mô hình Generative AI và xử lý ngôn ngữ tự nhiên cho hệ sinh thái Zalo.', NOW(), NOW());

    -- =====================================================================
    -- 4. USER 4: Đặng Minh Tuấn (Cần Thơ - An toàn thông tin K15)
    -- =====================================================================
    INSERT INTO users (email, password_hash, role_id, auth_provider, account_status, email_verified, is_account_verified, last_login_at, created_at, updated_at)
    VALUES (
        'tuan.dang.alumni@fpt.edu.vn',
        '$2a$10$7EqJtq98hPqEX7fNZaFWoO9mQ6jK.1Hmsj88vXmFz5w/m6bY4Z0.6',
        v_role_alumni_id,
        'LOCAL',
        'ACTIVE',
        true,
        true,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET account_status = 'ACTIVE', is_account_verified = true
    RETURNING id INTO v_user4_id;

    -- Profile User 4
    INSERT INTO user_profiles (
        user_id, full_name, avatar_url, cover_url, phone, major_id, cohort, student_code,
        headline, biography, campus, graduation_year, city, social_links, created_at, updated_at
    ) VALUES (
        v_user4_id,
        'Đặng Minh Tuấn',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&auto=format&fit=crop&q=80',
        '0971234789',
        v_major_ia_id,
        15,
        'IA150444',
        'Information Security Specialist tại MBBank Cần Thơ | Cyber Security',
        'Kỹ sư An toàn thông tin, chuyên về đánh giá lỗ hổng bảo mật (Penetration Testing) và giám sát phản ứng sự cố (SOC). Thành viên năng nổ của cộng đồng FPT Alumni miền Tây.',
        'FPT University Cần Thơ',
        2023,
        'Cần Thơ',
        ARRAY['https://linkedin.com/in/tuandang-infosec', 'https://github.com/tuandang-sec'],
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        headline = EXCLUDED.headline,
        biography = EXCLUDED.biography,
        city = EXCLUDED.city,
        major_id = EXCLUDED.major_id;

    DELETE FROM experiences WHERE user_id = v_user4_id;

    -- 3 Experiences (Career Path) cho User 4
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description, created_at, updated_at)
    VALUES
    (v_user4_id, 'Cyber Security Intern', 'FPT IS Cần Thơ', 'Đường Nguyễn Văn Cừ nối dài, An Bình, Ninh Kiều, Cần Thơ', '2022-06-01', '2022-11-30', false, false, 10.012587, 105.757362, 'Cần Thơ', 'Việt Nam', 'VN', 'MAPTILER', 'Thực tập kiểm thử thâm nhập ứng dụng web và phân tích mã độc cơ bản.', NOW(), NOW()),
    (v_user4_id, 'Junior SOC Analyst', 'VNPT Cần Thơ', 'Số 2 Nguyễn Trãi, An Hội, Ninh Kiều, Cần Thơ', '2022-12-01', '2023-12-31', false, false, 10.038889, 105.786111, 'Cần Thơ', 'Việt Nam', 'VN', 'MAPTILER', 'Giám sát và phân tích cảnh báo an ninh mạng cấp độ L1/L2 trên hệ thống SIEM.', NOW(), NOW()),
    (v_user4_id, 'Information Security Specialist', 'MBBank Cần Thơ', 'Đại lộ Hòa Bình, Phường An Cư, Quận Ninh Kiều, Cần Thơ', '2024-01-01', NULL, true, true, 10.035417, 105.783611, 'Cần Thơ', 'Việt Nam', 'VN', 'MAPTILER', 'Chịu trách nhiệm bảo mật cơ sở hạ tầng ngân hàng số khu vực Đồng Bằng Sông Cửu Long.', NOW(), NOW());

    -- =====================================================================
    -- 5. USER 5: Hoàng Bảo Trâm (Quy Nhơn - Khoa học dữ liệu K14)
    -- =====================================================================
    INSERT INTO users (email, password_hash, role_id, auth_provider, account_status, email_verified, is_account_verified, last_login_at, created_at, updated_at)
    VALUES (
        'tram.hoang.alumni@fpt.edu.vn',
        '$2a$10$7EqJtq98hPqEX7fNZaFWoO9mQ6jK.1Hmsj88vXmFz5w/m6bY4Z0.6',
        v_role_alumni_id,
        'LOCAL',
        'ACTIVE',
        true,
        true,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET account_status = 'ACTIVE', is_account_verified = true
    RETURNING id INTO v_user5_id;

    -- Profile User 5
    INSERT INTO user_profiles (
        user_id, full_name, avatar_url, cover_url, phone, major_id, cohort, student_code,
        headline, biography, campus, graduation_year, city, social_links, created_at, updated_at
    ) VALUES (
        v_user5_id,
        'Hoàng Bảo Trâm',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
        '0988776655',
        v_major_ads_id,
        14,
        'DS140555',
        'Data Scientist tại TMA Solutions Quy Nhơn | Big Data Analytics',
        'Chuyên viên phân tích và mô hình hóa dữ liệu cho các giải pháp Y tế thông minh và Nông nghiệp công nghệ cao. Từng đạt giải thưởng FPT Edu Research Festival.',
        'FPT University Quy Nhơn',
        2022,
        'Quy Nhơn',
        ARRAY['https://linkedin.com/in/tramhoang-data', 'https://github.com/tramhoang-ds'],
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        headline = EXCLUDED.headline,
        biography = EXCLUDED.biography,
        city = EXCLUDED.city,
        major_id = EXCLUDED.major_id;

    DELETE FROM experiences WHERE user_id = v_user5_id;

    -- 3 Experiences (Career Path) cho User 5
    INSERT INTO experiences (user_id, title, company, location, start_date, end_date, is_current, is_primary, latitude, longitude, location_city, location_country, location_country_code, geocoding_provider, description, created_at, updated_at)
    VALUES
    (v_user5_id, 'Data Analyst Intern', 'FPT Software Quy Nhơn', 'Tòa nhà An Phú Thịnh, Đường Lê Hồng Phong, Quy Nhơn', '2021-02-01', '2021-08-31', false, false, 13.774444, 109.224167, 'Quy Nhơn', 'Việt Nam', 'VN', 'MAPTILER', 'Thu thập và làm sạch dữ liệu lớn cho các hệ thống BI của khách hàng châu Âu.', NOW(), NOW()),
    (v_user5_id, 'Data Engineer', 'Trung tâm AI FPT Quy Nhơn', 'Khu đô thị Long Vân, Trần Hưng Đạo, Quy Nhơn, Bình Định', '2021-09-01', '2023-02-28', false, false, 13.782967, 109.196348, 'Quy Nhơn', 'Việt Nam', 'VN', 'MAPTILER', 'Xây dựng Data Pipeline với Apache Spark, Airflow và Google BigQuery.', NOW(), NOW()),
    (v_user5_id, 'Data Scientist', 'TMA Solutions Innovation Park Quy Nhơn', 'Khu đô thị Khoa học Quy Hòa, Phường Ghềnh Ráng, Quy Nhơn, Bình Định', '2023-03-01', NULL, true, true, 13.727500, 109.213611, 'Quy Nhơn', 'Việt Nam', 'VN', 'MAPTILER', 'Phát triển mô hình dự báo thời tiết và phân tích dữ liệu quan trắc môi trường cho Nam Trung Bộ.', NOW(), NOW());

END $$;
