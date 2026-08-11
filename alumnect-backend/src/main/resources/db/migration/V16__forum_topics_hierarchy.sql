-- =====================================================================
-- UC40 (Ask a question) — Chủ đề diễn đàn 2 CẤP (ngành lớn -> chủ đề con).
--
-- Bảng forum_topics đã được tạo + seed 6 chủ đề gốc ở V5. Migration này đưa
-- danh mục chủ đề về TRẠNG THÁI CUỐI dùng cho UC40:
--   1) Làm rõ ngành: "Engineering" -> "Software Engineering".
--   2) Thêm các chuyên ngành CNTT (AI, Data Science, Cybersecurity, Cloud & DevOps, UI/UX).
--   3) Thêm cột tự tham chiếu parent_id -> hệ phân cấp 2 cấp.
--   4) Seed chủ đề con cho từng ngành (tên chuẩn theo roadmap.sh / Stack Overflow Survey).
--
-- Phân loại tham khảo: roadmap.sh (Role-based vs Skill-based).
-- An toàn / idempotent: UPDATE theo tên cũ, ALTER ... IF NOT EXISTS,
-- INSERT ... ON CONFLICT nên chạy lại nhiều lần không lỗi.
-- =====================================================================

-- 1) Làm rõ ngành: "Engineering" -> "Software Engineering" (giữ nguyên câu hỏi đang gắn).
UPDATE forum_topics SET name = 'Software Engineering' WHERE name = 'Engineering';

-- 2) Schema phân cấp: cột tự tham chiếu + khóa ngoại + index.
ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS parent_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_forum_topics_parent') THEN
        ALTER TABLE forum_topics
            ADD CONSTRAINT fk_forum_topics_parent
            FOREIGN KEY (parent_id) REFERENCES forum_topics(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_forum_topics_parent_id ON forum_topics (parent_id);

-- 3) Các chuyên ngành CNTT (ngành lớn cấp 1, parent_id để mặc định NULL).
INSERT INTO forum_topics (name, description) VALUES
    ('Artificial Intelligence', 'Trí tuệ nhân tạo, học máy, học sâu, mô hình ngôn ngữ lớn'),
    ('Data Science',            'Khoa học dữ liệu, phân tích, kỹ thuật dữ liệu, BI'),
    ('Cybersecurity',           'An toàn thông tin, bảo mật hệ thống, kiểm thử xâm nhập'),
    ('Cloud & DevOps',          'Điện toán đám mây, CI/CD, hạ tầng và triển khai vận hành'),
    ('UI/UX Design',            'Thiết kế giao diện và trải nghiệm người dùng')
ON CONFLICT (name) DO NOTHING;

-- 4) Chủ đề con cho từng ngành. Gắn theo tên ngành lớn; ON CONFLICT DO UPDATE
--    để tự chèn mới hoặc cập nhật parent_id/description nếu đã tồn tại.
INSERT INTO forum_topics (name, description, parent_id)
SELECT child.name, child.description, p.id
FROM (VALUES
    -- Software Engineering
    ('Software Engineering', 'Frontend (React/Vue/Angular)', 'Lập trình giao diện web: React, Vue, Angular, HTML/CSS'),
    ('Software Engineering', 'Backend (Java/Node/Python)',   'Lập trình phía server: Java/Spring, Node.js, Python, API'),
    ('Software Engineering', 'Full Stack',                   'Kết hợp cả frontend và backend trong một vai trò'),
    ('Software Engineering', 'Mobile (Flutter/Android/iOS)', 'Phát triển ứng dụng di động: Flutter, Android, iOS'),
    ('Software Engineering', 'Database (SQL/NoSQL)',         'Cơ sở dữ liệu quan hệ và phi quan hệ, thiết kế schema, truy vấn'),
    ('Software Engineering', 'Testing & QA',                 'Kiểm thử phần mềm, unit/integration test, đảm bảo chất lượng'),
    ('Software Engineering', 'System Design',                'Thiết kế hệ thống, kiến trúc, khả năng mở rộng'),
    -- Artificial Intelligence
    ('Artificial Intelligence', 'Machine Learning',    'Học máy: mô hình, huấn luyện, đánh giá'),
    ('Artificial Intelligence', 'Deep Learning',       'Học sâu: mạng nơ-ron, CNN, RNN, Transformer'),
    ('Artificial Intelligence', 'NLP',                 'Xử lý ngôn ngữ tự nhiên'),
    ('Artificial Intelligence', 'Computer Vision',     'Thị giác máy tính, xử lý ảnh'),
    ('Artificial Intelligence', 'Generative AI / LLM', 'AI tạo sinh, mô hình ngôn ngữ lớn (LLM)'),
    -- Data Science
    ('Data Science', 'Data Analysis',           'Phân tích dữ liệu, thống kê'),
    ('Data Science', 'Data Engineering',        'Kỹ thuật dữ liệu, pipeline, ETL'),
    ('Data Science', 'Data Visualization / BI', 'Trực quan hóa dữ liệu, dashboard, Business Intelligence'),
    ('Data Science', 'Big Data',                'Dữ liệu lớn: Hadoop, Spark, xử lý phân tán'),
    -- Cybersecurity
    ('Cybersecurity', 'Web Security',              'Bảo mật ứng dụng web, OWASP'),
    ('Cybersecurity', 'Network Security',          'Bảo mật mạng, tường lửa, giám sát'),
    ('Cybersecurity', 'Pentest / Ethical Hacking', 'Kiểm thử xâm nhập, hacking có đạo đức'),
    ('Cybersecurity', 'Cryptography',              'Mật mã học, mã hóa, chữ ký số'),
    -- Cloud & DevOps
    ('Cloud & DevOps', 'AWS',                 'Nền tảng đám mây Amazon Web Services'),
    ('Cloud & DevOps', 'Azure',               'Nền tảng đám mây Microsoft Azure'),
    ('Cloud & DevOps', 'GCP',                 'Nền tảng đám mây Google Cloud Platform'),
    ('Cloud & DevOps', 'Docker & Kubernetes', 'Container hóa và điều phối container'),
    ('Cloud & DevOps', 'CI/CD',               'Tích hợp và triển khai liên tục'),
    -- UI/UX Design
    ('UI/UX Design', 'UI Design',            'Thiết kế giao diện người dùng'),
    ('UI/UX Design', 'UX Research',          'Nghiên cứu trải nghiệm người dùng'),
    ('UI/UX Design', 'Design Tools (Figma)', 'Công cụ thiết kế: Figma, Sketch, Adobe XD'),
    ('UI/UX Design', 'Prototyping',          'Dựng nguyên mẫu, wireframe, luồng tương tác')
) AS child(parent_name, name, description)
JOIN forum_topics p ON p.name = child.parent_name
ON CONFLICT (name) DO UPDATE
    SET parent_id = EXCLUDED.parent_id,
        description = EXCLUDED.description;
