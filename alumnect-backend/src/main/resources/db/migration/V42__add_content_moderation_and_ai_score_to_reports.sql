-- Migration V42: Bổ sung các cột phục vụ kiểm duyệt nội dung tự động và chấm điểm AI cho bảng reports

ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS ai_score DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    ADD COLUMN IF NOT EXISTS ai_flagged_reason VARCHAR(255),
    ADD COLUMN IF NOT EXISTS auto_moderated BOOLEAN DEFAULT FALSE NOT NULL,
    ADD COLUMN IF NOT EXISTS detected_keywords TEXT,
    ADD COLUMN IF NOT EXISTS reviewed_by BIGINT,
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Tạo chỉ mục tìm kiếm và phân loại mức độ rủi ro (Risk Sorting & Filtering)
CREATE INDEX IF NOT EXISTS idx_reports_ai_score ON reports (ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_reports_auto_moderated ON reports (auto_moderated);
CREATE INDEX IF NOT EXISTS idx_reports_status_ai_score ON reports (status, ai_score DESC);

-- Khóa ngoại tham chiếu người thực hiện kiểm duyệt thủ công (nếu có)
ALTER TABLE reports
    ADD CONSTRAINT fk_reports_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users (id) ON DELETE SET NULL;
