-- Migration V10: Bổ sung cột question_id và answer_id vào bảng reports phục vụ báo cáo vi phạm (UC78 & UC79)
-- Cho phép post_id có thể NULL và ràng buộc duy nhất 1 đối tượng được báo cáo (post, question, hoặc answer)

ALTER TABLE reports ALTER COLUMN post_id DROP NOT NULL;

ALTER TABLE reports ADD COLUMN question_id BIGINT;
ALTER TABLE reports ADD COLUMN answer_id BIGINT;

ALTER TABLE reports ADD CONSTRAINT fk_reports_question_id
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

ALTER TABLE reports ADD CONSTRAINT fk_reports_answer_id
    FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE;

CREATE INDEX idx_reports_question_id ON reports(question_id);
CREATE INDEX idx_reports_answer_id ON reports(answer_id);

ALTER TABLE reports ADD CONSTRAINT ck_reports_target
    CHECK (
        (post_id IS NOT NULL AND question_id IS NULL AND answer_id IS NULL) OR
        (post_id IS NULL AND question_id IS NOT NULL AND answer_id IS NULL) OR
        (post_id IS NULL AND question_id IS NULL AND answer_id IS NOT NULL)
    );

-- Bổ sung dữ liệu mẫu kiểm thử diễn đàn Q&A và báo cáo vi phạm (UC78 & UC79)
DO $$
DECLARE
    v_user_id BIGINT;
    v_reporter_id BIGINT;
    v_topic_id BIGINT;
    v_q1_id BIGINT;
    v_q2_id BIGINT;
    v_a1_id BIGINT;
    v_a2_id BIGINT;
BEGIN
    -- Lấy ID người dùng và chủ đề mẫu
    SELECT id INTO v_user_id FROM users ORDER BY id ASC LIMIT 1;
    SELECT id INTO v_reporter_id FROM users ORDER BY id DESC LIMIT 1;
    SELECT id INTO v_topic_id FROM forum_topics ORDER BY id ASC LIMIT 1;

    -- Nếu chưa có người dùng nào, thoát khối script
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;

    IF v_reporter_id IS NULL THEN
        v_reporter_id := v_user_id;
    END IF;

    -- 1. Chèn câu hỏi mẫu nếu bảng questions chưa có đủ dữ liệu
    IF NOT EXISTS (SELECT 1 FROM questions LIMIT 1) THEN
        INSERT INTO questions (author_id, topic_id, title, body, status, vote_count, answer_count, created_at, updated_at)
        VALUES 
            (v_user_id, v_topic_id, 'Làm thế nào để chuyển hướng từ QA sang Backend Engineer?', 'Mình có 2 năm làm Manual QA, hiện muốn học Spring Boot và chuyển sang làm Java Backend. Liệu cơ hội việc làm năm 2026 thế nào?', 'ACTIVE', 12, 5, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
            (v_user_id, v_topic_id, 'Chia sẻ link tải phần mềm crack bản quyền thiết kế đồ họa?', 'Mọi người cho mình xin link Google Drive tải bản crack phần mềm Photoshop và Illustrator mới nhất với ạ.', 'ACTIVE', 2, 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');
    END IF;

    -- Lấy ID câu hỏi có sẵn hoặc mới chèn
    SELECT id INTO v_q1_id FROM questions ORDER BY id ASC LIMIT 1;
    SELECT id INTO v_q2_id FROM questions ORDER BY id DESC LIMIT 1;

    -- 2. Chèn câu trả lời mẫu nếu bảng answers chưa có đủ dữ liệu
    IF v_q1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM answers LIMIT 1) THEN
        INSERT INTO answers (question_id, author_id, body, status, vote_count, created_at, updated_at)
        VALUES 
            (v_q1_id, v_user_id, 'Bạn nên bắt đầu bằng việc học Java Core thật vững, sau đó tự làm 1 project Spring Boot REST API nhỏ và đẩy lên GitHub. Khi phỏng vấn hãy tự tin thể hiện tư duy thiết kế.', 'ACTIVE', 8, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
            (v_q1_id, v_user_id, 'Truy cập ngay trang web xyz-click-here.com để nhận tiền thưởng 500k và bộ tài liệu phỏng vấn độc quyền!', 'ACTIVE', 0, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours');
    END IF;

    -- Lấy ID câu trả lời có sẵn hoặc mới chèn
    SELECT id INTO v_a1_id FROM answers ORDER BY id ASC LIMIT 1;
    SELECT id INTO v_a2_id FROM answers ORDER BY id DESC LIMIT 1;

    -- 3. Chèn các bản ghi báo cáo câu hỏi vi phạm (UC78)
    IF v_q1_id IS NOT NULL THEN
        INSERT INTO reports (question_id, reporter_id, reason, description, status, created_at)
        SELECT v_q1_id, v_reporter_id, 'SPAM', 'Bài đăng câu hỏi bị trùng lặp nhiều lần trên các chủ đề khác nhau.', 'PENDING', NOW() - INTERVAL '5 hours'
        WHERE NOT EXISTS (SELECT 1 FROM reports WHERE question_id = v_q1_id AND reporter_id = v_reporter_id);
    END IF;

    IF v_q2_id IS NOT NULL AND v_q2_id <> v_q1_id THEN
        INSERT INTO reports (question_id, reporter_id, reason, description, status, created_at)
        SELECT v_q2_id, v_reporter_id, 'INAPPROPRIATE', 'Chia sẻ liên kết vi phạm bản quyền và quy định cộng đồng AlumNect.', 'PENDING', NOW() - INTERVAL '2 hours'
        WHERE NOT EXISTS (SELECT 1 FROM reports WHERE question_id = v_q2_id AND reporter_id = v_reporter_id);
    END IF;

    -- 4. Chèn các bản ghi báo cáo câu trả lời vi phạm (UC79)
    IF v_a1_id IS NOT NULL THEN
        INSERT INTO reports (answer_id, reporter_id, reason, description, status, created_at)
        SELECT v_a1_id, v_reporter_id, 'SPAM', 'Câu trả lời bị gửi lặp lại nhiều lần liên tiếp.', 'PENDING', NOW() - INTERVAL '3 hours'
        WHERE NOT EXISTS (SELECT 1 FROM reports WHERE answer_id = v_a1_id AND reporter_id = v_reporter_id);
    END IF;

    IF v_a2_id IS NOT NULL AND v_a2_id <> v_a1_id THEN
        INSERT INTO reports (answer_id, reporter_id, reason, description, status, created_at)
        SELECT v_a2_id, v_reporter_id, 'SCAM_OR_FRAUD', 'Chứa liên kết lừa đảo dẫn tới trang web giả mạo đánh cắp thông tin.', 'PENDING', NOW() - INTERVAL '1 hour'
        WHERE NOT EXISTS (SELECT 1 FROM reports WHERE answer_id = v_a2_id AND reporter_id = v_reporter_id);
    END IF;

END $$;


