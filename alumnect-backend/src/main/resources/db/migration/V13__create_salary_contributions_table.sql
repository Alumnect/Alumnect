-- V13: Salary Board (UC50 Contribute salary data) — danh mục ngành nghề + dữ liệu lương đóng góp ẩn danh

-- industries: Catalog of industries/career fields.
CREATE TABLE industries (
    id   BIGSERIAL     PRIMARY KEY,
    name VARCHAR(120)  NOT NULL UNIQUE
);

-- salary_contributions: Community-contributed salary samples (monthly gross).
-- user_id kept private ở tầng ứng dụng (không expose qua API) — chỉ số liệu tổng hợp mới được hiển thị.
CREATE TABLE salary_contributions (
    id               BIGSERIAL      PRIMARY KEY,
    user_id          BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    industry_id      BIGINT         REFERENCES industries(id) ON DELETE SET NULL,
    job_title        VARCHAR(150)   NOT NULL,
    company          VARCHAR(150),
    region           VARCHAR(120),
    years_experience SMALLINT,
    gross_amount     NUMERIC(12,2)  NOT NULL,
    currency         VARCHAR(3)     NOT NULL DEFAULT 'VND',
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX idx_salary_contributions_industry_id ON salary_contributions (industry_id);
CREATE INDEX idx_salary_contributions_user_id ON salary_contributions (user_id);

-- Seed danh mục ngành nghề, đối chiếu đúng 24 chuyên ngành đào tạo thực tế của FPTU (xem
-- INSERT INTO majors ở V1__init_database_schema.sql) để mọi cựu sinh viên đều tìm được ngành phù hợp:
--   CNTT (SE,IA,AI,IS,IT,ADS) | Thiết kế (GD,UIUX) | Truyền thông (MC,PR) | Ngôn ngữ (E,BE,K,BK,C,BTC,J)
--   Luật (LAW,EL) | Marketing/TMĐT (MKT,EC) | Kinh doanh (IB,BA) | Tài chính (FB) | Du lịch-KS (HM)
INSERT INTO industries (name) VALUES
('Công nghệ thông tin'),
('Tài chính - Ngân hàng'),
('Marketing - Thương mại điện tử'),
('Thiết kế - Sáng tạo'),
('Truyền thông - Quan hệ công chúng'),
('Ngôn ngữ - Biên phiên dịch'),
('Luật'),
('Kinh doanh - Quản trị'),
('Du lịch - Khách sạn'),
('Giáo dục - Đào tạo'),
('Khác')
ON CONFLICT (name) DO NOTHING;
