-- ==============================================================================
-- AlumNect Database Migration - Version 15
-- Feature: UC97 - Xem bảng xếp hạng & Tính điểm uy tín Mentor (Mentor Ranking & Reviews)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- 1. Bổ sung các chỉ số uy tín và hiệu suất cố vấn vào bảng mentor_profiles
ALTER TABLE mentor_profiles
    ADD COLUMN reputation_score INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN completed_tasks  INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN rating           NUMERIC(3, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN review_count     INTEGER NOT NULL DEFAULT 0;

-- 2. Thêm các ràng buộc kiểm tra tính hợp lệ của dữ liệu
ALTER TABLE mentor_profiles
    ADD CONSTRAINT ck_mentor_profiles_reputation_score CHECK (reputation_score >= 0),
    ADD CONSTRAINT ck_mentor_profiles_completed_tasks CHECK (completed_tasks >= 0),
    ADD CONSTRAINT ck_mentor_profiles_rating CHECK (rating >= 0.00 AND rating <= 5.00),
    ADD CONSTRAINT ck_mentor_profiles_review_count CHECK (review_count >= 0);

-- 3. Tạo composite index tối ưu hóa truy vấn sắp xếp thứ hạng Mentor theo trạng thái và điểm uy tín
CREATE INDEX idx_mentor_profiles_ranking ON mentor_profiles(mentor_status, reputation_score DESC, completed_tasks DESC);

-- 4. Bảng mentor_reviews: Lưu trữ đánh giá và phản hồi của học viên cho Mentor
CREATE TABLE mentor_reviews (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mentor_profile_id BIGINT NOT NULL,
    student_id        BIGINT NOT NULL,
    rating            INTEGER NOT NULL,
    comment           TEXT,
    points_awarded    INTEGER NOT NULL DEFAULT 0,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_mentor_reviews_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT fk_mentor_reviews_mentor FOREIGN KEY (mentor_profile_id) REFERENCES mentor_profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_mentor_reviews_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Chỉ mục tối ưu hóa truy vấn đánh giá và kiểm tra quy tắc Anti-Spam (1 lần / 7 ngày)
CREATE INDEX idx_mentor_reviews_mentor_id ON mentor_reviews(mentor_profile_id);
CREATE INDEX idx_mentor_reviews_student_lookup ON mentor_reviews(student_id, mentor_profile_id, created_at DESC);
