-- ==============================================================================
-- AlumNect Database Migration - Version 19
-- Feature: UC101 - Chọn Mentor & Gửi Request Trực Tiếp (Direct Mentoring Request)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- 1. Bổ sung các cột phân biệt loại yêu cầu và liên kết Mentor trực tiếp vào bảng mentoring_requests
ALTER TABLE mentoring_requests 
    ADD COLUMN target_mentor_id BIGINT,
    ADD COLUMN request_type VARCHAR(20) NOT NULL DEFAULT 'GENERAL';

-- 2. Ràng buộc kiểm tra loại yêu cầu: GENERAL (UC100) hoặc DIRECT (UC101)
ALTER TABLE mentoring_requests
    ADD CONSTRAINT ck_mentoring_requests_request_type 
    CHECK (request_type IN ('GENERAL', 'DIRECT'));

-- 3. Khóa ngoại liên kết target_mentor_id tới bảng mentor_profiles
ALTER TABLE mentoring_requests
    ADD CONSTRAINT fk_mentoring_requests_target_mentor 
    FOREIGN KEY (target_mentor_id) REFERENCES mentor_profiles(id) ON DELETE SET NULL;

-- 4. Index tối ưu truy vấn theo target_mentor_id và request_type
CREATE INDEX idx_mentoring_requests_target_mentor_id ON mentoring_requests (target_mentor_id);
CREATE INDEX idx_mentoring_requests_request_type ON mentoring_requests (request_type);
