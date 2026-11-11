-- ==============================================================================
-- AlumNect Database Migration - Version 44
-- Feature: Seed data cho Quỹ Mentoring Task, Sổ quỹ giao dịch (UC121) 
--          và Vé Tranh chấp & Hòa giải Task (UC116 - UC120)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

DO $$
DECLARE
    v_admin_id      BIGINT;
    v_student1_id   BIGINT;
    v_student2_id   BIGINT;
    v_mentor1_id    BIGINT;
    v_mentor2_id    BIGINT;
    v_mentor3_id    BIGINT;
    v_student3_id   BIGINT;

    v_req1_id       BIGINT;
    v_req2_id       BIGINT;
    v_req3_id       BIGINT;
    v_req4_id       BIGINT;
    v_req5_id       BIGINT;
    v_req6_id       BIGINT;

    v_conv1_id      BIGINT;
    v_conv2_id      BIGINT;
    v_conv3_id      BIGINT;
    v_conv4_id      BIGINT;
    v_conv5_id      BIGINT;
    v_conv6_id      BIGINT;

    v_deal1_id      BIGINT;
    v_deal2_id      BIGINT;
    v_deal3_id      BIGINT;
    v_deal4_id      BIGINT;
    v_deal5_id      BIGINT;
    v_deal6_id      BIGINT;

    v_task1_id      BIGINT;
    v_task2_id      BIGINT;
    v_task3_id      BIGINT;
    v_task4_id      BIGINT;
    v_task5_id      BIGINT;
    v_task6_id      BIGINT;

    v_payout_task5_id   BIGINT;
    v_payout_task6_id   BIGINT;
    v_refund_task6_id   BIGINT;

    v_ticket1_id    BIGINT;
    v_ticket2_id    BIGINT;
    v_ticket3_id    BIGINT;
    v_ticket4_id    BIGINT;
    v_ticket5_id    BIGINT;
BEGIN
    -- 1. Lấy ID người dùng hiện có hoặc tạo thêm
    SELECT id INTO v_admin_id FROM users WHERE email = 'letrannh2004@gmail.com' LIMIT 1;
    IF v_admin_id IS NULL THEN
        SELECT id INTO v_admin_id FROM users WHERE role_id = 3 LIMIT 1;
    END IF;

    SELECT id INTO v_student1_id FROM users WHERE email = 'fierzone0310@gmail.com' LIMIT 1;
    IF v_student1_id IS NULL THEN
        SELECT id INTO v_student1_id FROM users WHERE role_id = 1 ORDER BY id ASC LIMIT 1;
    END IF;

    SELECT id INTO v_student2_id FROM users WHERE email = 'test.author@gmail.com' LIMIT 1;
    IF v_student2_id IS NULL THEN
        v_student2_id := v_student1_id;
    END IF;

    -- Tạo Mentor 1: Hoàng Nam (Senior Java Architect)
    SELECT id INTO v_mentor1_id FROM users WHERE email = 'mentor.nam@fpt.edu.vn' LIMIT 1;
    IF v_mentor1_id IS NULL THEN
        INSERT INTO users (email, password_hash, role_id, auth_provider, account_status, email_verified, is_account_verified, created_at, updated_at)
        VALUES ('mentor.nam@fpt.edu.vn', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 2, 'LOCAL', 'ACTIVE', true, true, now(), now())
        RETURNING id INTO v_mentor1_id;

        INSERT INTO user_profiles (user_id, full_name, avatar_url, student_code, headline, campus, graduation_year, city, created_at, updated_at)
        VALUES (v_mentor1_id, 'Hoàng Nam', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'ALUM-00101', 'Senior Backend Engineer @ FPT Software', 'Hòa Lạc', 2020, 'Hà Nội', now(), now());

        INSERT INTO mentor_profiles (user_id, bio, working_mode, mentoring_type, mentor_status, reputation_score, completed_tasks, rating, review_count, created_at, updated_at)
        VALUES (v_mentor1_id, 'Chuyên gia Backend với 5 năm kinh nghiệm Java Spring Boot, Microservices và Kafka.', 'ONLINE', 'INDIVIDUAL', 'ACTIVE', 95, 24, 4.90, 20, now(), now());
    END IF;

    -- Tạo Mentor 2: Nguyễn Mai Lan (Lead Frontend Architect)
    SELECT id INTO v_mentor2_id FROM users WHERE email = 'mentor.lan@fpt.edu.vn' LIMIT 1;
    IF v_mentor2_id IS NULL THEN
        INSERT INTO users (email, password_hash, role_id, auth_provider, account_status, email_verified, is_account_verified, created_at, updated_at)
        VALUES ('mentor.lan@fpt.edu.vn', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 2, 'LOCAL', 'ACTIVE', true, true, now(), now())
        RETURNING id INTO v_mentor2_id;

        INSERT INTO user_profiles (user_id, full_name, avatar_url, student_code, headline, campus, graduation_year, city, created_at, updated_at)
        VALUES (v_mentor2_id, 'Nguyễn Mai Lan', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'ALUM-00102', 'Lead Frontend Architect @ VNG Corp', 'TP. Hồ Chí Minh', 2019, 'TP. Hồ Chí Minh', now(), now());

        INSERT INTO mentor_profiles (user_id, bio, working_mode, mentoring_type, mentor_status, reputation_score, completed_tasks, rating, review_count, created_at, updated_at)
        VALUES (v_mentor2_id, 'Hơn 6 năm phát triển Frontend với React, Next.js và kiến trúc Web quy mô lớn.', 'ONLINE', 'BOTH', 'ACTIVE', 88, 18, 4.80, 15, now(), now());
    END IF;

    -- Tạo Mentor 3: Trần Anh Quốc (Principal DevOps / Cloud Consultant)
    SELECT id INTO v_mentor3_id FROM users WHERE email = 'mentor.quoc@fpt.edu.vn' LIMIT 1;
    IF v_mentor3_id IS NULL THEN
        INSERT INTO users (email, password_hash, role_id, auth_provider, account_status, email_verified, is_account_verified, created_at, updated_at)
        VALUES ('mentor.quoc@fpt.edu.vn', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 2, 'LOCAL', 'ACTIVE', true, true, now(), now())
        RETURNING id INTO v_mentor3_id;

        INSERT INTO user_profiles (user_id, full_name, avatar_url, student_code, headline, campus, graduation_year, city, created_at, updated_at)
        VALUES (v_mentor3_id, 'Trần Anh Quốc', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'ALUM-00103', 'Principal DevOps & Cloud Consultant', 'Đà Nẵng', 2018, 'Đà Nẵng', now(), now());

        INSERT INTO mentor_profiles (user_id, bio, working_mode, mentoring_type, mentor_status, reputation_score, completed_tasks, rating, review_count, created_at, updated_at)
        VALUES (v_mentor3_id, 'Chuyên gia tư vấn hạ tầng Kubernetes, CI/CD và giải pháp Cloud AWS/GCP.', 'BOTH', 'BOTH', 'ACTIVE', 98, 31, 5.00, 28, now(), now());
    END IF;

    -- Tạo Student 3: Nguyễn Thành An
    SELECT id INTO v_student3_id FROM users WHERE email = 'student.an@fpt.edu.vn' LIMIT 1;
    IF v_student3_id IS NULL THEN
        INSERT INTO users (email, password_hash, role_id, auth_provider, account_status, email_verified, is_account_verified, created_at, updated_at)
        VALUES ('student.an@fpt.edu.vn', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 1, 'LOCAL', 'ACTIVE', true, true, now(), now())
        RETURNING id INTO v_student3_id;

        INSERT INTO user_profiles (user_id, full_name, avatar_url, student_code, headline, campus, cohort, city, created_at, updated_at)
        VALUES (v_student3_id, 'Nguyễn Thành An', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', 'SE180352', 'Sinh viên K18 Kỹ thuật Phần mềm', 'Hòa Lạc', 18, 'Hà Nội', now(), now());
    END IF;

    -- =========================================================================
    -- 2. Tạo Mentoring Requests & Conversations & Deals
    -- =========================================================================
    -- Request 1:
    INSERT INTO mentoring_requests (student_id, industry_id, title, description, budget_min, budget_max, working_mode, participation_type, task_type, status, created_at, updated_at)
    VALUES (v_student1_id, 1, 'Xây dựng hệ thống Microservices với Spring Cloud & Kafka', 'Cần mentor đồng hành thiết kế Event-Driven và triển khai Kafka streaming', 2000000, 3000000, 'ONLINE', 'INDIVIDUAL', 'TECHNICAL_CONSULTING', 'MATCHED', now() - interval '20 days', now() - interval '18 days')
    RETURNING id INTO v_req1_id;

    INSERT INTO conversations (type, mentoring_request_id, mentoring_student_id, mentoring_mentor_id, created_by, title, created_at)
    VALUES ('MENTORING', v_req1_id, v_student1_id, v_mentor1_id, v_student1_id, 'Trao đổi Mentoring: Spring Cloud & Kafka', now() - interval '19 days')
    RETURNING id INTO v_conv1_id;

    INSERT INTO conversation_participants (conversation_id, user_id, role, is_accepted)
    VALUES (v_conv1_id, v_student1_id, 'MEMBER', true), (v_conv1_id, v_mentor1_id, 'MEMBER', true);

    INSERT INTO mentoring_deals (student_id, mentor_id, request_id, conversation_id, ticket_type, proposal_source, task_scope, agreed_price, deadline, working_mode, participation_type, task_type, expected_result, status, student_confirmed, mentor_confirmed, is_paid, paid_at, created_by, updated_by, created_at, updated_at)
    VALUES (v_student1_id, v_mentor1_id, v_req1_id, v_conv1_id, 'DEAL', 'RENEGOTIATION', 'Hướng dẫn kiến trúc Service Discovery, API Gateway và Event Streaming', 2500000, now() + interval '10 days', 'ONLINE', 'INDIVIDUAL', 'TECHNICAL_CONSULTING', 'Hệ thống chạy ổn định và tài liệu kiến trúc', 'DEAL_CONFIRMED', true, true, true, now() - interval '17 days', v_mentor1_id, v_student1_id, now() - interval '18 days', now() - interval '17 days')
    RETURNING id INTO v_deal1_id;

    UPDATE mentoring_requests SET confirmed_deal_id = v_deal1_id, selected_mentor_id = v_mentor1_id WHERE id = v_req1_id;

    -- Request 2:
    INSERT INTO mentoring_requests (student_id, industry_id, title, description, budget_min, budget_max, working_mode, participation_type, task_type, status, created_at, updated_at)
    VALUES (v_student2_id, 1, 'Review kiến trúc Next.js App Router & Tối ưu Web Vitals', 'Cần tư vấn kiến trúc Server Components và tối ưu hiệu năng', 1500000, 2000000, 'ONLINE', 'INDIVIDUAL', 'TECHNICAL_CONSULTING', 'MATCHED', now() - interval '15 days', now() - interval '14 days')
    RETURNING id INTO v_req2_id;

    INSERT INTO conversations (type, mentoring_request_id, mentoring_student_id, mentoring_mentor_id, created_by, title, created_at)
    VALUES ('MENTORING', v_req2_id, v_student2_id, v_mentor2_id, v_student2_id, 'Trao đổi Mentoring: Next.js App Router', now() - interval '14 days')
    RETURNING id INTO v_conv2_id;

    INSERT INTO conversation_participants (conversation_id, user_id, role, is_accepted)
    VALUES (v_conv2_id, v_student2_id, 'MEMBER', true), (v_conv2_id, v_mentor2_id, 'MEMBER', true);

    INSERT INTO mentoring_deals (student_id, mentor_id, request_id, conversation_id, ticket_type, proposal_source, task_scope, agreed_price, deadline, working_mode, participation_type, task_type, expected_result, status, student_confirmed, mentor_confirmed, is_paid, paid_at, created_by, updated_by, created_at, updated_at)
    VALUES (v_student2_id, v_mentor2_id, v_req2_id, v_conv2_id, 'DEAL', 'RENEGOTIATION', 'Đánh giá cấu trúc thư mục, caching và chỉ số Lighthouse', 1800000, now() + interval '5 days', 'ONLINE', 'INDIVIDUAL', 'TECHNICAL_CONSULTING', 'Báo cáo audit chi tiết và code refactor', 'DEAL_CONFIRMED', true, true, true, now() - interval '13 days', v_mentor2_id, v_student2_id, now() - interval '14 days', now() - interval '13 days')
    RETURNING id INTO v_deal2_id;

    UPDATE mentoring_requests SET confirmed_deal_id = v_deal2_id, selected_mentor_id = v_mentor2_id WHERE id = v_req2_id;

    -- Request 3:
    INSERT INTO mentoring_requests (student_id, industry_id, title, description, budget_min, budget_max, working_mode, participation_type, task_type, status, created_at, updated_at)
    VALUES (v_student3_id, 1, 'Đồ án tốt nghiệp: Triển khai Kubernetes & CI/CD Pipeline', 'Cần mentor hướng dẫn thiết lập Cluster K8s và viết Helm charts', 3000000, 3500000, 'ONLINE', 'GROUP', 'CAPSTONE_ADVICE', 'MATCHED', now() - interval '25 days', now() - interval '24 days')
    RETURNING id INTO v_req3_id;

    INSERT INTO conversations (type, mentoring_request_id, mentoring_student_id, mentoring_mentor_id, created_by, title, created_at)
    VALUES ('MENTORING', v_req3_id, v_student3_id, v_mentor3_id, v_student3_id, 'Trao đổi Mentoring: Kubernetes & CI/CD', now() - interval '24 days')
    RETURNING id INTO v_conv3_id;

    INSERT INTO conversation_participants (conversation_id, user_id, role, is_accepted)
    VALUES (v_conv3_id, v_student3_id, 'MEMBER', true), (v_conv3_id, v_mentor3_id, 'MEMBER', true);

    INSERT INTO mentoring_deals (student_id, mentor_id, request_id, conversation_id, ticket_type, proposal_source, task_scope, agreed_price, deadline, working_mode, participation_type, task_type, expected_result, status, student_confirmed, mentor_confirmed, is_paid, paid_at, created_by, updated_by, created_at, updated_at)
    VALUES (v_student3_id, v_mentor3_id, v_req3_id, v_conv3_id, 'DEAL', 'RENEGOTIATION', 'Hướng dẫn triển khai cụm K8s, GitOps ArgoCD và pipeline GitHub Actions', 3200000, now() - interval '3 days', 'ONLINE', 'GROUP', 'CAPSTONE_ADVICE', 'Pipeline deploy tự động và tài liệu bảo vệ đồ án', 'DEAL_CONFIRMED', true, true, true, now() - interval '23 days', v_mentor3_id, v_student3_id, now() - interval '24 days', now() - interval '23 days')
    RETURNING id INTO v_deal3_id;

    UPDATE mentoring_requests SET confirmed_deal_id = v_deal3_id, selected_mentor_id = v_mentor3_id WHERE id = v_req3_id;

    -- Request 4:
    INSERT INTO mentoring_requests (student_id, industry_id, title, description, budget_min, budget_max, working_mode, participation_type, task_type, status, created_at, updated_at)
    VALUES (v_student1_id, 1, 'Luyện phỏng vấn System Design & Cấu trúc dữ liệu', 'Mock interview vị trí Backend Fresher/Junior với các câu hỏi thiết kế hệ thống', 1000000, 2000000, 'ONLINE', 'INDIVIDUAL', 'MOCK_INTERVIEW', 'MATCHED', now() - interval '10 days', now() - interval '9 days')
    RETURNING id INTO v_req4_id;

    INSERT INTO conversations (type, mentoring_request_id, mentoring_student_id, mentoring_mentor_id, created_by, title, created_at)
    VALUES ('MENTORING', v_req4_id, v_student1_id, v_mentor1_id, v_student1_id, 'Trao đổi Mentoring: System Design Interview', now() - interval '9 days')
    RETURNING id INTO v_conv4_id;

    INSERT INTO conversation_participants (conversation_id, user_id, role, is_accepted)
    VALUES (v_conv4_id, v_student1_id, 'MEMBER', true), (v_conv4_id, v_mentor1_id, 'MEMBER', true);

    INSERT INTO mentoring_deals (student_id, mentor_id, request_id, conversation_id, ticket_type, proposal_source, task_scope, agreed_price, deadline, working_mode, participation_type, task_type, expected_result, status, student_confirmed, mentor_confirmed, is_paid, paid_at, created_by, updated_by, created_at, updated_at)
    VALUES (v_student1_id, v_mentor1_id, v_req4_id, v_conv4_id, 'DEAL', 'RENEGOTIATION', '3 buổi mock interview 1-1 chuyên sâu và nhận xét chi tiết sau mỗi buổi', 1500000, now() + interval '14 days', 'ONLINE', 'INDIVIDUAL', 'MOCK_INTERVIEW', 'Bộ đánh giá năng lực phỏng vấn và checklist cải thiện', 'DEAL_CONFIRMED', true, true, true, now() - interval '8 days', v_mentor1_id, v_student1_id, now() - interval '9 days', now() - interval '8 days')
    RETURNING id INTO v_deal4_id;

    UPDATE mentoring_requests SET confirmed_deal_id = v_deal4_id, selected_mentor_id = v_mentor1_id WHERE id = v_req4_id;

    -- Request 5:
    INSERT INTO mentoring_requests (student_id, industry_id, title, description, budget_min, budget_max, working_mode, participation_type, task_type, status, created_at, updated_at)
    VALUES (v_student2_id, 1, 'Tư vấn thiết kế Database & Tối ưu SQL nâng cao', 'Hướng dẫn đánh chỉ mục Indexing và tối ưu câu lệnh truy vấn phức tạp trên PostgreSQL', 1500000, 2500000, 'ONLINE', 'INDIVIDUAL', 'TECHNICAL_CONSULTING', 'MATCHED', now() - interval '30 days', now() - interval '29 days')
    RETURNING id INTO v_req5_id;

    INSERT INTO conversations (type, mentoring_request_id, mentoring_student_id, mentoring_mentor_id, created_by, title, created_at)
    VALUES ('MENTORING', v_req5_id, v_student2_id, v_mentor3_id, v_student2_id, 'Trao đổi Mentoring: Database & SQL Tuning', now() - interval '29 days')
    RETURNING id INTO v_conv5_id;

    INSERT INTO conversation_participants (conversation_id, user_id, role, is_accepted)
    VALUES (v_conv5_id, v_student2_id, 'MEMBER', true), (v_conv5_id, v_mentor3_id, 'MEMBER', true);

    INSERT INTO mentoring_deals (student_id, mentor_id, request_id, conversation_id, ticket_type, proposal_source, task_scope, agreed_price, deadline, working_mode, participation_type, task_type, expected_result, status, student_confirmed, mentor_confirmed, is_paid, paid_at, created_by, updated_by, created_at, updated_at)
    VALUES (v_student2_id, v_mentor3_id, v_req5_id, v_conv5_id, 'DEAL', 'RENEGOTIATION', 'Phân tích EXPLAIN ANALYZE và thiết kế chuẩn hóa CSDL', 2000000, now() - interval '5 days', 'ONLINE', 'INDIVIDUAL', 'TECHNICAL_CONSULTING', 'CSDL tối ưu và giảm 80% thời gian thực thi query', 'DEAL_CONFIRMED', true, true, true, now() - interval '28 days', v_mentor3_id, v_student2_id, now() - interval '29 days', now() - interval '28 days')
    RETURNING id INTO v_deal5_id;

    UPDATE mentoring_requests SET confirmed_deal_id = v_deal5_id, selected_mentor_id = v_mentor3_id WHERE id = v_req5_id;

    -- Request 6:
    INSERT INTO mentoring_requests (student_id, industry_id, title, description, budget_min, budget_max, working_mode, participation_type, task_type, status, created_at, updated_at)
    VALUES (v_student3_id, 1, 'Hướng dẫn bảo mật Web OWASP & Pentest thực chiến', 'Khóa huấn luyện phát hiện và khắc phục các lỗ hổng bảo mật phổ biến', 2500000, 3000000, 'ONLINE', 'INDIVIDUAL', 'OTHER', 'MATCHED', now() - interval '40 days', now() - interval '38 days')
    RETURNING id INTO v_req6_id;

    INSERT INTO conversations (type, mentoring_request_id, mentoring_student_id, mentoring_mentor_id, created_by, title, created_at)
    VALUES ('MENTORING', v_req6_id, v_student3_id, v_mentor2_id, v_student3_id, 'Trao đổi Mentoring: Web Pentest thực chiến', now() - interval '38 days')
    RETURNING id INTO v_conv6_id;

    INSERT INTO conversation_participants (conversation_id, user_id, role, is_accepted)
    VALUES (v_conv6_id, v_student3_id, 'MEMBER', true), (v_conv6_id, v_mentor2_id, 'MEMBER', true);

    INSERT INTO mentoring_deals (student_id, mentor_id, request_id, conversation_id, ticket_type, proposal_source, task_scope, agreed_price, deadline, working_mode, participation_type, task_type, expected_result, status, student_confirmed, mentor_confirmed, is_paid, paid_at, created_by, updated_by, created_at, updated_at)
    VALUES (v_student3_id, v_mentor2_id, v_req6_id, v_conv6_id, 'DEAL', 'RENEGOTIATION', 'Thực hành khai thác và vá lỗi SQL Injection, XSS, CSRF trên lab demo', 2800000, now() - interval '10 days', 'ONLINE', 'INDIVIDUAL', 'OTHER', 'Báo cáo đánh giá bảo mật và chứng chỉ hoàn thành', 'DEAL_CONFIRMED', true, true, true, now() - interval '37 days', v_mentor2_id, v_student3_id, now() - interval '38 days', now() - interval '37 days')
    RETURNING id INTO v_deal6_id;

    UPDATE mentoring_requests SET confirmed_deal_id = v_deal6_id, selected_mentor_id = v_mentor2_id WHERE id = v_req6_id;

    -- =========================================================================
    -- 3. Tạo Mentoring Tasks
    -- =========================================================================
    -- Task 1: DISPUTED
    INSERT INTO mentoring_tasks (deal_id, student_id, mentor_id, request_id, conversation_id, task_title, task_scope, agreed_price, deadline, working_mode, participation_type, task_type, expected_result, status, started_at, created_at, updated_at)
    VALUES (v_deal1_id, v_student1_id, v_mentor1_id, v_req1_id, v_conv1_id, 'Xây dựng hệ thống Microservices với Spring Cloud & Kafka', 'Hướng dẫn kiến trúc Service Discovery, API Gateway và Event Streaming', 2500000, now() + interval '10 days', 'ONLINE', 'INDIVIDUAL', 'TECHNICAL_CONSULTING', 'Hệ thống chạy ổn định và tài liệu kiến trúc', 'DISPUTED', now() - interval '17 days', now() - interval '17 days', now())
    RETURNING id INTO v_task1_id;

    -- Task 2: DISPUTED (Thực ra là Settlement đang Review)
    INSERT INTO mentoring_tasks (deal_id, student_id, mentor_id, request_id, conversation_id, task_title, task_scope, agreed_price, deadline, working_mode, participation_type, task_type, expected_result, status, started_at, created_at, updated_at)
    VALUES (v_deal2_id, v_student2_id, v_mentor2_id, v_req2_id, v_conv2_id, 'Review kiến trúc Next.js App Router & Tối ưu Web Vitals', 'Đánh giá cấu trúc thư mục, caching và chỉ số Lighthouse', 1800000, now() + interval '5 days', 'ONLINE', 'INDIVIDUAL', 'TECHNICAL_CONSULTING', 'Báo cáo audit chi tiết và code refactor', 'DISPUTED', now() - interval '13 days', now() - interval '13 days', now())
    RETURNING id INTO v_task2_id;

    -- Task 3: DISPUTED
    INSERT INTO mentoring_tasks (deal_id, student_id, mentor_id, request_id, conversation_id, task_title, task_scope, agreed_price, deadline, working_mode, participation_type, task_type, expected_result, status, started_at, created_at, updated_at)
    VALUES (v_deal3_id, v_student3_id, v_mentor3_id, v_req3_id, v_conv3_id, 'Đồ án tốt nghiệp: Triển khai Kubernetes & CI/CD Pipeline', 'Hướng dẫn triển khai cụm K8s, GitOps ArgoCD và pipeline GitHub Actions', 3200000, now() - interval '3 days', 'ONLINE', 'GROUP', 'CAPSTONE_ADVICE', 'Pipeline deploy tự động và tài liệu bảo vệ đồ án', 'DISPUTED', now() - interval '23 days', now() - interval '23 days', now())
    RETURNING id INTO v_task3_id;

    -- Task 4: IN_PROGRESS (Escrow đang giữ an toàn)
    INSERT INTO mentoring_tasks (deal_id, student_id, mentor_id, request_id, conversation_id, task_title, task_scope, agreed_price, deadline, working_mode, participation_type, task_type, expected_result, status, started_at, created_at, updated_at)
    VALUES (v_deal4_id, v_student1_id, v_mentor1_id, v_req4_id, v_conv4_id, 'Luyện phỏng vấn System Design & Cấu trúc dữ liệu', '3 buổi mock interview 1-1 chuyên sâu và nhận xét chi tiết sau mỗi buổi', 1500000, now() + interval '14 days', 'ONLINE', 'INDIVIDUAL', 'MOCK_INTERVIEW', 'Bộ đánh giá năng lực phỏng vấn và checklist cải thiện', 'IN_PROGRESS', now() - interval '8 days', now() - interval '8 days', now())
    RETURNING id INTO v_task4_id;

    -- Task 5: COMPLETED (Đã quyết toán hoàn tất)
    INSERT INTO mentoring_tasks (deal_id, student_id, mentor_id, request_id, conversation_id, task_title, task_scope, agreed_price, deadline, working_mode, participation_type, task_type, expected_result, status, started_at, completed_at, created_at, updated_at)
    VALUES (v_deal5_id, v_student2_id, v_mentor3_id, v_req5_id, v_conv5_id, 'Tư vấn thiết kế Database & Tối ưu SQL nâng cao', 'Phân tích EXPLAIN ANALYZE và thiết kế chuẩn hóa CSDL', 2000000, now() - interval '5 days', 'ONLINE', 'INDIVIDUAL', 'TECHNICAL_CONSULTING', 'CSDL tối ưu và giảm 80% thời gian thực thi query', 'COMPLETED', now() - interval '28 days', now() - interval '4 days', now() - interval '28 days', now() - interval '4 days')
    RETURNING id INTO v_task5_id;

    -- Task 6: RESOLVED (Đã phân xử chia tiền)
    INSERT INTO mentoring_tasks (deal_id, student_id, mentor_id, request_id, conversation_id, task_title, task_scope, agreed_price, deadline, working_mode, participation_type, task_type, expected_result, status, started_at, completed_at, created_at, updated_at)
    VALUES (v_deal6_id, v_student3_id, v_mentor2_id, v_req6_id, v_conv6_id, 'Hướng dẫn bảo mật Web OWASP & Pentest thực chiến', 'Thực hành khai thác và vá lỗi SQL Injection, XSS, CSRF trên lab demo', 2800000, now() - interval '10 days', 'ONLINE', 'INDIVIDUAL', 'OTHER', 'Báo cáo đánh giá bảo mật và chứng chỉ hoàn thành', 'RESOLVED', now() - interval '37 days', now() - interval '8 days', now() - interval '37 days', now() - interval '8 days')
    RETURNING id INTO v_task6_id;

    -- Cập nhật ngược mentoring_task_id vào conversations
    UPDATE conversations SET mentoring_task_id = v_task1_id WHERE id = v_conv1_id;
    UPDATE conversations SET mentoring_task_id = v_task2_id WHERE id = v_conv2_id;
    UPDATE conversations SET mentoring_task_id = v_task3_id WHERE id = v_conv3_id;
    UPDATE conversations SET mentoring_task_id = v_task4_id WHERE id = v_conv4_id;
    UPDATE conversations SET mentoring_task_id = v_task5_id WHERE id = v_conv5_id;
    UPDATE conversations SET mentoring_task_id = v_task6_id WHERE id = v_conv6_id;

    -- =========================================================================
    -- 4. Tạo Mentoring Payment Ledgers (Sổ quỹ giao dịch)
    -- =========================================================================
    -- Escrow inflows cho cả 6 tasks
    INSERT INTO mentoring_payment_ledgers (request_id, task_id, deal_id, student_id, mentor_id, amount, transaction_type, status, note, created_at, updated_at)
    VALUES (v_req1_id, v_task1_id, v_deal1_id, v_student1_id, v_mentor1_id, 2500000, 'ESCROW_COLLECTION', 'SUCCEEDED', 'Ký quỹ Escrow cho Task 1 (Spring Cloud & Kafka)', now() - interval '17 days', now() - interval '17 days');

    INSERT INTO mentoring_payment_ledgers (request_id, task_id, deal_id, student_id, mentor_id, amount, transaction_type, status, note, created_at, updated_at)
    VALUES (v_req2_id, v_task2_id, v_deal2_id, v_student2_id, v_mentor2_id, 1800000, 'ESCROW_COLLECTION', 'SUCCEEDED', 'Ký quỹ Escrow cho Task 2 (Next.js App Router)', now() - interval '13 days', now() - interval '13 days');

    INSERT INTO mentoring_payment_ledgers (request_id, task_id, deal_id, student_id, mentor_id, amount, transaction_type, status, note, created_at, updated_at)
    VALUES (v_req3_id, v_task3_id, v_deal3_id, v_student3_id, v_mentor3_id, 3200000, 'ESCROW_COLLECTION', 'SUCCEEDED', 'Ký quỹ Escrow cho Task 3 (Kubernetes Cluster)', now() - interval '23 days', now() - interval '23 days');

    INSERT INTO mentoring_payment_ledgers (request_id, task_id, deal_id, student_id, mentor_id, amount, transaction_type, status, note, created_at, updated_at)
    VALUES (v_req4_id, v_task4_id, v_deal4_id, v_student1_id, v_mentor1_id, 1500000, 'ESCROW_COLLECTION', 'SUCCEEDED', 'Ký quỹ Escrow cho Task 4 (System Design Interview)', now() - interval '8 days', now() - interval '8 days');

    INSERT INTO mentoring_payment_ledgers (request_id, task_id, deal_id, student_id, mentor_id, amount, transaction_type, status, note, created_at, updated_at)
    VALUES (v_req5_id, v_task5_id, v_deal5_id, v_student2_id, v_mentor3_id, 2000000, 'ESCROW_COLLECTION', 'SUCCEEDED', 'Ký quỹ Escrow cho Task 5 (Database & SQL Tuning)', now() - interval '28 days', now() - interval '28 days');

    INSERT INTO mentoring_payment_ledgers (request_id, task_id, deal_id, student_id, mentor_id, amount, transaction_type, status, note, created_at, updated_at)
    VALUES (v_req6_id, v_task6_id, v_deal6_id, v_student3_id, v_mentor2_id, 2800000, 'ESCROW_COLLECTION', 'SUCCEEDED', 'Ký quỹ Escrow cho Task 6 (Web OWASP Pentest)', now() - interval '37 days', now() - interval '37 days');

    -- Payout cho Task 5 (Hoàn thành 100%)
    INSERT INTO mentoring_payment_ledgers (request_id, task_id, deal_id, student_id, mentor_id, amount, transaction_type, status, note, created_at, updated_at)
    VALUES (v_req5_id, v_task5_id, v_deal5_id, v_student2_id, v_mentor3_id, 2000000, 'PAYOUT', 'SUCCEEDED', 'Quyết toán thù lao trọn gói cho Mentor Trần Anh Quốc', now() - interval '4 days', now() - interval '4 days')
    RETURNING id INTO v_payout_task5_id;

    -- Payout & Refund cho Task 6 (Phán quyết phân chia 50-50)
    INSERT INTO mentoring_payment_ledgers (request_id, task_id, deal_id, student_id, mentor_id, amount, transaction_type, status, note, created_at, updated_at)
    VALUES (v_req6_id, v_task6_id, v_deal6_id, v_student3_id, v_mentor2_id, 1400000, 'PAYOUT', 'SUCCEEDED', 'Chi trả thù lao 50% theo phán quyết Ticket TC-2026-0025 cho Mentor Nguyễn Mai Lan', now() - interval '8 days', now() - interval '8 days')
    RETURNING id INTO v_payout_task6_id;

    INSERT INTO mentoring_payment_ledgers (request_id, task_id, deal_id, student_id, mentor_id, amount, transaction_type, status, note, created_at, updated_at)
    VALUES (v_req6_id, v_task6_id, v_deal6_id, v_student3_id, v_mentor2_id, 1400000, 'REFUND', 'SUCCEEDED', 'Hoàn phí 50% theo phán quyết Ticket TC-2026-0025 cho Học viên Nguyễn Thành An', now() - interval '8 days', now() - interval '8 days')
    RETURNING id INTO v_refund_task6_id;

    -- =========================================================================
    -- 5. Tạo Mentoring Dispute & Settlement Tickets (UC116 - UC120)
    -- =========================================================================
    -- Ticket 1: Chờ tiếp nhận (OPEN - DISPUTE)
    INSERT INTO mentoring_dispute_tickets (
        ticket_code, ticket_type, task_id, conversation_id, created_by, student_id, mentor_id,
        title, description, mentor_amount, student_refund, total_amount,
        status, settlement_status, created_at, updated_at
    ) VALUES (
        'TC-2026-0041', 'DISPUTE', v_task1_id, v_conv1_id, v_student1_id, v_student1_id, v_mentor1_id,
        'Khiếu nại tiến độ giao nộp mã nguồn và tài liệu kiến trúc',
        'Cố vấn trễ hạn giao nộp mã nguồn hơn 10 ngày so với cam kết ban đầu, thiếu tài liệu thiết kế kiến trúc và không tham gia 2 buổi họp đồng bộ định kỳ.',
        1000000, 1500000, 2500000,
        'OPEN', 'PENDING', now() - interval '1 day', now()
    ) RETURNING id INTO v_ticket1_id;

    -- Ticket 2: Đang hòa giải (IN_REVIEW - SETTLEMENT)
    INSERT INTO mentoring_dispute_tickets (
        ticket_code, ticket_type, task_id, conversation_id, created_by, student_id, mentor_id,
        title, description, mentor_amount, student_refund, total_amount,
        status, handled_by, accepted_at, settlement_status, created_at, updated_at
    ) VALUES (
        'ST-2026-0089', 'SETTLEMENT', v_task2_id, v_conv2_id, v_student2_id, v_student2_id, v_mentor2_id,
        'Thỏa thuận dừng Task sớm do thay đổi công nghệ phía Học viên',
        'Hai bên đã thống nhất dừng nhiệm vụ sau khi hoàn thành phần Review kiến trúc Server Components. Mentor nhận 1.200.000 VNĐ, hoàn trả Học viên 600.000 VNĐ.',
        1200000, 600000, 1800000,
        'IN_REVIEW', v_admin_id, now() - interval '12 hours', 'PENDING', now() - interval '2 days', now()
    ) RETURNING id INTO v_ticket2_id;

    -- Ticket 3: Chờ tiếp nhận (OPEN - DISPUTE)
    INSERT INTO mentoring_dispute_tickets (
        ticket_code, ticket_type, task_id, conversation_id, created_by, student_id, mentor_id,
        title, description, mentor_amount, student_refund, total_amount,
        status, settlement_status, created_at, updated_at
    ) VALUES (
        'TC-2026-0038', 'DISPUTE', v_task3_id, v_conv3_id, v_student3_id, v_student3_id, v_mentor3_id,
        'Tranh chấp chất lượng hướng dẫn cấu hình Kubernetes Cluster',
        'Cấu hình Helm charts và Ingress NGINX bị lỗi xung đột certificate, mentor phản hồi chậm và từ chối hỗ trợ sửa lỗi trước ngày demo tốt nghiệp.',
        800000, 2400000, 3200000,
        'OPEN', 'PENDING', now() - interval '3 days', now()
    ) RETURNING id INTO v_ticket3_id;

    -- Ticket 4: Đã phán quyết (RESOLVED - DISPUTE)
    INSERT INTO mentoring_dispute_tickets (
        ticket_code, ticket_type, task_id, conversation_id, created_by, student_id, mentor_id,
        title, description, mentor_amount, student_refund, total_amount,
        status, handled_by, accepted_at, resolved_at, resolution_note,
        decision, dispute_fee, settlement_status, mentor_payout_ledger_id, student_refund_ledger_id,
        created_at, updated_at
    ) VALUES (
        'TC-2026-0025', 'DISPUTE', v_task6_id, v_conv6_id, v_student3_id, v_student3_id, v_mentor2_id,
        'Phán quyết hòa giải chia sẻ chi phí khóa học Pentest thực chiến',
        'Nhiệm vụ gặp trở ngại môi trường lab thực hành, ban quản trị đã can thiệp phân xử chia đôi quyền lợi tài chính.',
        1400000, 1400000, 2800000,
        'RESOLVED', v_admin_id, now() - interval '10 days', now() - interval '8 days',
        'Phân chia 50% thù lao cho Cố vấn và hoàn 50% học phí cho Học viên căn cứ trên khối lượng module đã hoàn thành.',
        'PARTIAL_SPLIT', 0, 'SETTLED', v_payout_task6_id, v_refund_task6_id,
        now() - interval '12 days', now() - interval '8 days'
    ) RETURNING id INTO v_ticket4_id;

    -- Ticket 5: Đã nghiệm thu xong (RESOLVED - SETTLEMENT)
    INSERT INTO mentoring_dispute_tickets (
        ticket_code, ticket_type, task_id, conversation_id, created_by, student_id, mentor_id,
        title, description, mentor_amount, student_refund, total_amount,
        status, handled_by, accepted_at, resolved_at, resolution_note,
        decision, dispute_fee, settlement_status, mentor_payout_ledger_id,
        created_at, updated_at
    ) VALUES (
        'ST-2026-0072', 'SETTLEMENT', v_task5_id, v_conv5_id, v_student2_id, v_student2_id, v_mentor3_id,
        'Thống nhất nghiệm thu quyết toán toàn bộ thù lao cho Mentor',
        'Học viên xác nhận Mentor hoàn thành xuất sắc tư vấn index SQL và tuning database Postgres.',
        2000000, 0, 2000000,
        'RESOLVED', v_admin_id, now() - interval '6 days', now() - interval '4 days',
        'Chi trả 100% thù lao cho Cố vấn sau nghiệm thu đầy đủ.',
        'FULL_MENTOR_PAYMENT', 0, 'SETTLED', v_payout_task5_id,
        now() - interval '8 days', now() - interval '4 days'
    ) RETURNING id INTO v_ticket5_id;

    -- =========================================================================
    -- 6. Tạo Mentoring Ticket Evidences (Bằng chứng tranh chấp)
    -- =========================================================================
    INSERT INTO mentoring_ticket_evidences (ticket_id, uploaded_by, title, description, file_url, file_name, file_size, file_type, created_at)
    VALUES 
    (v_ticket1_id, v_student1_id, 'Ảnh chụp cam kết tiến độ', 'Ảnh chụp màn hình tin nhắn thỏa thuận deadline giao nộp code ban đầu', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600', 'chat_agreement_deadline.png', 458000, 'image/png', now() - interval '20 hours'),
    (v_ticket1_id, v_student1_id, 'Git commit log trễ hạn', 'Ảnh chụp Git commit history cho thấy không có commit nào trong 2 tuần', 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600', 'git_log_delayed.png', 624000, 'image/png', now() - interval '18 hours'),
    (v_ticket2_id, v_student2_id, 'Biên bản thống nhất dừng công việc', 'Biên bản thỏa thuận giữa hai bên về phạm vi đã hoàn thành', 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600', 'settlement_agreement.pdf', 312000, 'application/pdf', now() - interval '1 day'),
    (v_ticket3_id, v_student3_id, 'Log lỗi Kubernetes Cluster Crash', 'Terminal log ghi lại lỗi CrashLoopBackOff của Pods', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600', 'k8s_error_log.png', 890000, 'image/png', now() - interval '2 days');

    -- =========================================================================
    -- 7. Tạo Mentoring Ticket Messages (Luồng thảo luận hòa giải)
    -- =========================================================================
    INSERT INTO mentoring_ticket_messages (ticket_id, sender_id, sender_role, message_type, content, proposed_mentor_amount, proposed_student_refund, created_at)
    VALUES
    (v_ticket1_id, v_student1_id, 'STUDENT', 'TEXT', 'Em đã đợi hơn 10 ngày nhưng anh Nam không phản hồi tin nhắn cũng như không gửi bản thiết kế kiến trúc như cam kết.', 1000000, 1500000, now() - interval '22 hours'),
    (v_ticket1_id, v_mentor1_id, 'MENTOR', 'TEXT', 'Chào An và Quản trị viên, đợt vừa rồi công ty anh vào đợt release gấp nên anh bị trễ. Anh đã hoàn thiện 60% sườn code và sẵn sàng chuyển giao trong hôm nay.', 1500000, 1000000, now() - interval '15 hours'),
    (v_ticket2_id, v_student2_id, 'STUDENT', 'TEXT', 'Nhóm em đã thống nhất với chị Lan dừng tại đây do dự án chuyển hướng sang React Native.', 1200000, 600000, now() - interval '1 day'),
    (v_ticket2_id, v_admin_id, 'ADMIN', 'TEXT', 'Ban quản trị đã tiếp nhận vé hòa giải ST-2026-0089 và đang kiểm tra số dư quỹ Escrow trước khi duyệt quyết toán.', NULL, NULL, now() - interval '10 hours');

END $$;
