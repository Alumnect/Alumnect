-- Xóa vĩnh viễn các cột graduation_year và note khỏi bảng verification_requests
ALTER TABLE public.verification_requests DROP COLUMN IF EXISTS graduation_year;
ALTER TABLE public.verification_requests DROP COLUMN IF EXISTS note;
