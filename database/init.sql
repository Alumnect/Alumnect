-- Khởi tạo các cấu hình ban đầu cho Database Alumnect nếu chạy Docker
CREATE TABLE IF NOT EXISTS test_table (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);