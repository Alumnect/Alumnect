-- Migration: Thêm cột location_city vào bảng salary_contributions để đồng bộ với location_city của Experience/AlumniMap
ALTER TABLE salary_contributions ADD COLUMN IF NOT EXISTS location_city VARCHAR(120);
