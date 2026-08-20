-- =====================================================================
-- Seed dữ liệu DEMO cho diễn đàn Q&A (kiểm thử UC38/UC40, đặc biệt là
-- sắp xếp đa tiêu chí - multi-sort). Mỗi câu hỏi có thể gắn độc lập với
-- một thể loại trong forum_topics và một ngành trong majors.
--
-- Bộ dữ liệu cố ý có:
--   * Câu TRÙNG answers (15) khác votes -> kiểm chứng votes làm tie-break khi ưu tiên "answers".
--   * Câu TRÙNG votes (50) khác answers -> kiểm chứng answers làm tie-break khi ưu tiên "votes".
--   * Câu TRÙNG cả hai (18 votes / 9 answers) -> tie-break bằng createdAt.
--
-- An toàn / idempotent:
--   * Gắn author vào 1 user Student/Alumni đang có; không có user thì KHÔNG seed (guard EXISTS).
--   * Chỉ chèn câu chưa tồn tại (guard NOT EXISTS theo title) -> chạy lại không trùng.
--   * topic_id lấy theo tên thể loại đã seed ở V5; major_id lấy theo mã ngành ở V1.
-- =====================================================================

INSERT INTO questions (author_id, topic_id, major_id, title, body, status, vote_count, answer_count)
SELECT
    (SELECT id FROM users
        WHERE role_id IN (SELECT id FROM roles WHERE name IN ('STUDENT', 'ALUMNI'))
        ORDER BY id LIMIT 1),
    (SELECT id FROM forum_topics WHERE name = v.category_name),
    (SELECT id FROM majors WHERE code = v.major_code),
    v.title, v.body, 'ACTIVE', v.votes, v.answers
FROM (VALUES
    ('Roadmap học Software Engineering cho người mới ra trường?',
     'Mình mới tốt nghiệp, muốn theo hướng kỹ thuật phần mềm — xin lộ trình học và dự án thực hành từ cơ bản.',
     30, 15, 'Career', 'SE'),
    ('Học Cloud & DevOps nên bắt đầu từ đâu cho hiệu quả?',
     'CI/CD, Docker, Kubernetes, AWS nhiều quá — nên học theo thứ tự nào để không bị ngợp?',
     80, 15, 'Education', 'SE'),
    ('Người mới nên bắt đầu học UI/UX Design như thế nào?',
     'Xin lộ trình học thiết kế UI/UX, công cụ (Figma) và cách xây portfolio để xin việc.',
     50, 5, 'Education', 'GD'),
    ('Kinh nghiệm phỏng vấn vị trí kỹ sư AI/ML?',
     'Sắp phỏng vấn AI Engineer, nên ôn chủ đề gì (toán, ML, coding) và câu hỏi thường gặp?',
     50, 22, 'Interview', 'AI'),
    ('Mẹo thương lượng tăng lương khi nhảy việc?',
     'Có nên chủ động nói mức lương mong muốn trước không, và deal thế nào cho khéo?',
     120, 2, 'Salary', NULL),
    ('Tài liệu học Data Science miễn phí chất lượng?',
     'Xin nguồn học phân tích dữ liệu, thống kê và machine learning cơ bản, ưu tiên tiếng Việt.',
     10, 40, 'Education', 'ADS'),
    ('Lộ trình vào ngành An toàn thông tin (Cybersecurity)?',
     'Mình muốn theo bảo mật — cần học nền tảng gì, chứng chỉ nào và luyện tập ở đâu?',
     18, 9, 'Career', 'IS'),
    ('Cách chuẩn bị hồ sơ xin học bổng thạc sĩ ngành CNTT?',
     'Cần GPA, IELTS, thư giới thiệu và bài luận như thế nào để tăng cơ hội đậu học bổng?',
     18, 9, 'Education', NULL)
) AS v(title, body, votes, answers, category_name, major_code)
WHERE EXISTS (SELECT 1 FROM users WHERE role_id IN (SELECT id FROM roles WHERE name IN ('STUDENT', 'ALUMNI')))
  AND NOT EXISTS (SELECT 1 FROM questions q WHERE q.title = v.title);
