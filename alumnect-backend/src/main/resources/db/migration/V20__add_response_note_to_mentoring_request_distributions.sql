-- ==============================================================================
-- AlumNect Database Migration - Version 20
-- Feature: UC102 - Xem phản hồi yêu cầu Mentoring (View Mentoring Request Responses)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- 1. Bổ sung cột lưu lời nhắn / lý do phản hồi của Mentor vào bảng phân phối
ALTER TABLE mentoring_request_distributions
    ADD COLUMN response_note VARCHAR(500);
