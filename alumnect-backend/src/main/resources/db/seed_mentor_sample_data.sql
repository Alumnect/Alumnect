-- ==============================================================================
-- SEED DATA: KÍCH HOẠT 5 ALUMNI THÀNH MENTOR VỚI ĐẦY ĐỦ CHỈ SỐ XẾP HẠNG (UC97)
-- ==============================================================================

DO $$
DECLARE
    v_user1_id BIGINT;
    v_user2_id BIGINT;
    v_user3_id BIGINT;
    v_user4_id BIGINT;
    v_user5_id BIGINT;

    v_mp1_id BIGINT;
    v_mp2_id BIGINT;
    v_mp3_id BIGINT;
    v_mp4_id BIGINT;
    v_mp5_id BIGINT;

    v_pkg_1m_id BIGINT;
    v_pkg_3m_id BIGINT;
    v_pkg_6m_id BIGINT;

    v_student_id BIGINT;
BEGIN
    -- 1. Lấy ID của 5 Alumni
    SELECT id INTO v_user1_id FROM users WHERE email = 'an.nguyen.alumni@fpt.edu.vn';
    SELECT id INTO v_user2_id FROM users WHERE email = 'phuong.tran.alumni@fpt.edu.vn';
    SELECT id INTO v_user3_id FROM users WHERE email = 'nam.le.alumni@fpt.edu.vn';
    SELECT id INTO v_user4_id FROM users WHERE email = 'tuan.dang.alumni@fpt.edu.vn';
    SELECT id INTO v_user5_id FROM users WHERE email = 'tram.hoang.alumni@fpt.edu.vn';

    -- Lấy sinh viên làm mẫu đánh giá
    SELECT id INTO v_student_id FROM users WHERE role_id = (SELECT id FROM roles WHERE name = 'STUDENT') LIMIT 1;
    IF v_student_id IS NULL THEN
        SELECT id INTO v_student_id FROM users WHERE id NOT IN (v_user1_id, v_user2_id, v_user3_id, v_user4_id, v_user5_id) LIMIT 1;
    END IF;

    -- 2. Lấy ID các gói dịch vụ
    SELECT id INTO v_pkg_1m_id FROM mentor_packages WHERE duration_months = 1 LIMIT 1;
    SELECT id INTO v_pkg_3m_id FROM mentor_packages WHERE duration_months = 3 LIMIT 1;
    SELECT id INTO v_pkg_6m_id FROM mentor_packages WHERE duration_months = 6 LIMIT 1;

    IF v_pkg_6m_id IS NULL THEN v_pkg_6m_id := 3; END IF;
    IF v_pkg_3m_id IS NULL THEN v_pkg_3m_id := 2; END IF;
    IF v_pkg_1m_id IS NULL THEN v_pkg_1m_id := 1; END IF;

    -- =========================================================================
    -- 3. TẠO / CẬP NHẬT HỒ SƠ MENTOR (mentor_profiles)
    -- =========================================================================

    -- User 3: Lê Hoàng Nam -> Top 1 CNTT (195 điểm)
    IF v_user3_id IS NOT NULL THEN
        INSERT INTO mentor_profiles (
            user_id, bio, working_mode, mentoring_type, cv_file_key, mentor_status,
            reputation_score, completed_tasks, rating, review_count, created_at, updated_at
        ) VALUES (
            v_user3_id,
            'Kỹ sư AI & Deep Learning tại Viettel AI. Sẵn sàng định hướng học máy, Computer Vision và đồ án tốt nghiệp cho sinh viên FPTU.',
            'ONLINE', 'INDIVIDUAL', 'cv/nam_le_cv.pdf', 'ACTIVE',
            195, 14, 4.92, 12, NOW() - INTERVAL '30 days', NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            mentor_status = 'ACTIVE',
            reputation_score = 195,
            completed_tasks = 14,
            rating = 4.92,
            review_count = 12,
            updated_at = NOW()
        RETURNING id INTO v_mp3_id;
    END IF;

    -- User 1: Nguyễn Văn An -> Top 2 CNTT (150 điểm)
    IF v_user1_id IS NOT NULL THEN
        INSERT INTO mentor_profiles (
            user_id, bio, working_mode, mentoring_type, cv_file_key, mentor_status,
            reputation_score, completed_tasks, rating, review_count, created_at, updated_at
        ) VALUES (
            v_user1_id,
            'Lead Backend Engineer tại Viettel Solutions. Chuyên sâu về kiến trúc Microservices phân tán chịu tải cao, Spring Boot và Cloud Computing.',
            'BOTH', 'BOTH', 'cv/an_nguyen_cv.pdf', 'ACTIVE',
            150, 9, 4.88, 8, NOW() - INTERVAL '20 days', NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            mentor_status = 'ACTIVE',
            reputation_score = 150,
            completed_tasks = 9,
            rating = 4.88,
            review_count = 8,
            updated_at = NOW()
        RETURNING id INTO v_mp1_id;
    END IF;

    -- User 4: Đặng Minh Tuấn -> Top 3 CNTT (110 điểm)
    IF v_user4_id IS NOT NULL THEN
        INSERT INTO mentor_profiles (
            user_id, bio, working_mode, mentoring_type, cv_file_key, mentor_status,
            reputation_score, completed_tasks, rating, review_count, created_at, updated_at
        ) VALUES (
            v_user4_id,
            'Chuyên gia An toàn thông tin / Cyber Security tại FPT IS. Tư vấn định hướng chứng chỉ OSCP, CEH và kỹ năng bảo mật ứng dụng.',
            'ONLINE', 'INDIVIDUAL', 'cv/tuan_dang_cv.pdf', 'ACTIVE',
            110, 6, 4.75, 4, NOW() - INTERVAL '15 days', NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            mentor_status = 'ACTIVE',
            reputation_score = 110,
            completed_tasks = 6,
            rating = 4.75,
            review_count = 4,
            updated_at = NOW()
        RETURNING id INTO v_mp4_id;
    END IF;

    -- User 2: Trần Thị Mai Phương -> Top 1 Thiết kế - Sáng tạo (180 điểm)
    IF v_user2_id IS NOT NULL THEN
        INSERT INTO mentor_profiles (
            user_id, bio, working_mode, mentoring_type, cv_file_key, mentor_status,
            reputation_score, completed_tasks, rating, review_count, created_at, updated_at
        ) VALUES (
            v_user2_id,
            'Senior Product Designer tại MoMo. Chia sẻ kinh nghiệm xây dựng Portfolio thiết kế UX/UI, Design System và phỏng vấn nghề nghiệp.',
            'BOTH', 'INDIVIDUAL', 'cv/phuong_tran_cv.pdf', 'ACTIVE',
            180, 11, 4.95, 10, NOW() - INTERVAL '25 days', NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            mentor_status = 'ACTIVE',
            reputation_score = 180,
            completed_tasks = 11,
            rating = 4.95,
            review_count = 10,
            updated_at = NOW()
        RETURNING id INTO v_mp2_id;
    END IF;

    -- User 5: Hoàng Bảo Trâm -> Top 4 CNTT / Top 1 Tài chính (85 điểm)
    IF v_user5_id IS NOT NULL THEN
        INSERT INTO mentor_profiles (
            user_id, bio, working_mode, mentoring_type, cv_file_key, mentor_status,
            reputation_score, completed_tasks, rating, review_count, created_at, updated_at
        ) VALUES (
            v_user5_id,
            'Data Analyst tại Techcombank. Định hướng phân tích dữ liệu tài chính kinh doanh, SQL nâng cao, Python for Data Analytics.',
            'ONLINE', 'INDIVIDUAL', 'cv/tram_hoang_cv.pdf', 'ACTIVE',
            85, 4, 4.60, 3, NOW() - INTERVAL '10 days', NOW()
        )
        ON CONFLICT (user_id) DO UPDATE SET
            mentor_status = 'ACTIVE',
            reputation_score = 85,
            completed_tasks = 4,
            rating = 4.60,
            review_count = 3,
            updated_at = NOW()
        RETURNING id INTO v_mp5_id;
    END IF;

    -- =========================================================================
    -- 4. LIÊN KẾT LĨNH VỰC CHUYÊN MÔN (mentor_supported_fields)
    -- 1: Công nghệ thông tin | 2: Tài chính - Ngân hàng | 3: Marketing | 4: Thiết kế
    -- =========================================================================
    
    -- Xóa liên kết cũ để làm mới
    DELETE FROM mentor_supported_fields WHERE mentor_profile_id IN (v_mp1_id, v_mp2_id, v_mp3_id, v_mp4_id, v_mp5_id);

    -- Lê Hoàng Nam -> CNTT (1)
    INSERT INTO mentor_supported_fields (mentor_profile_id, industry_id) VALUES (v_mp3_id, 1);

    -- Nguyễn Văn An -> CNTT (1) & Marketing - TMĐT (3)
    INSERT INTO mentor_supported_fields (mentor_profile_id, industry_id) VALUES (v_mp1_id, 1), (v_mp1_id, 3);

    -- Đặng Minh Tuấn -> CNTT (1)
    INSERT INTO mentor_supported_fields (mentor_profile_id, industry_id) VALUES (v_mp4_id, 1);

    -- Trần Thị Mai Phương -> Thiết kế - Sáng tạo (4)
    INSERT INTO mentor_supported_fields (mentor_profile_id, industry_id) VALUES (v_mp2_id, 4);

    -- Hoàng Bảo Trâm -> CNTT (1) & Tài chính - Ngân hàng (2)
    INSERT INTO mentor_supported_fields (mentor_profile_id, industry_id) VALUES (v_mp5_id, 1), (v_mp5_id, 2);

    -- =========================================================================
    -- 5. KÍCH HOẠT GÓI SUBSCRIPTION CÒN HIỆU LỰC (mentor_subscriptions)
    -- =========================================================================

    -- Xóa các subscription cũ chưa hoàn tất
    DELETE FROM mentor_subscriptions WHERE mentor_profile_id IN (v_mp1_id, v_mp2_id, v_mp3_id, v_mp4_id, v_mp5_id);

    -- Lê Hoàng Nam (Gói 6 tháng)
    INSERT INTO mentor_subscriptions (mentor_profile_id, package_id, price_at_purchase, duration_months, status, start_date, end_date)
    VALUES (v_mp3_id, v_pkg_6m_id, 500000.00, 6, 'ACTIVE', NOW() - INTERVAL '30 days', NOW() + INTERVAL '150 days');

    -- Nguyễn Văn An (Gói 6 tháng)
    INSERT INTO mentor_subscriptions (mentor_profile_id, package_id, price_at_purchase, duration_months, status, start_date, end_date)
    VALUES (v_mp1_id, v_pkg_6m_id, 500000.00, 6, 'ACTIVE', NOW() - INTERVAL '20 days', NOW() + INTERVAL '160 days');

    -- Đặng Minh Tuấn (Gói 3 tháng)
    INSERT INTO mentor_subscriptions (mentor_profile_id, package_id, price_at_purchase, duration_months, status, start_date, end_date)
    VALUES (v_mp4_id, v_pkg_3m_id, 250000.00, 3, 'ACTIVE', NOW() - INTERVAL '15 days', NOW() + INTERVAL '75 days');

    -- Trần Thị Mai Phương (Gói 6 tháng)
    INSERT INTO mentor_subscriptions (mentor_profile_id, package_id, price_at_purchase, duration_months, status, start_date, end_date)
    VALUES (v_mp2_id, v_pkg_6m_id, 500000.00, 6, 'ACTIVE', NOW() - INTERVAL '25 days', NOW() + INTERVAL '155 days');

    -- Hoàng Bảo Trâm (Gói 3 tháng)
    INSERT INTO mentor_subscriptions (mentor_profile_id, package_id, price_at_purchase, duration_months, status, start_date, end_date)
    VALUES (v_mp5_id, v_pkg_3m_id, 250000.00, 3, 'ACTIVE', NOW() - INTERVAL '10 days', NOW() + INTERVAL '80 days');

    -- =========================================================================
    -- 6. THÊM CÁC ĐÁNH GIÁ MẪU CỦA SINH VIÊN (mentor_reviews)
    -- =========================================================================
    IF v_student_id IS NOT NULL THEN
        DELETE FROM mentor_reviews WHERE mentor_profile_id IN (v_mp1_id, v_mp2_id, v_mp3_id, v_mp4_id, v_mp5_id);

        INSERT INTO mentor_reviews (mentor_profile_id, student_id, rating, comment, points_awarded, created_at)
        VALUES 
            (v_mp3_id, v_student_id, 5, 'Mentor Nam hướng dẫn đồ án AI cực kỳ có tâm, giúp em hiểu rõ kiến thức Deep Learning!', 10, NOW() - INTERVAL '10 days'),
            (v_mp1_id, v_student_id, 5, 'Anh An review CV và chỉ ra rất nhiều điểm cần cải thiện về kiến trúc Backend. Rất cảm ơn anh!', 10, NOW() - INTERVAL '8 days'),
            (v_mp2_id, v_student_id, 5, 'Chị Phương chia sẻ cẩm nang thiết kế UI/UX rất trực quan và chi tiết!', 10, NOW() - INTERVAL '7 days'),
            (v_mp4_id, v_student_id, 5, 'Tư vấn lộ trình An toàn thông tin rất thực tế và định hướng rõ ràng.', 10, NOW() - INTERVAL '5 days'),
            (v_mp5_id, v_student_id, 4, 'Chị Trâm giải đáp các thắc mắc về phân tích dữ liệu rất dễ hiểu.', 5, NOW() - INTERVAL '2 days');
    END IF;

    RAISE NOTICE 'SUCCESS: Da kich hoat thanh cong 5 Alumni thanh Mentor voi day du chi so Xep hang UC97!';
END $$;
