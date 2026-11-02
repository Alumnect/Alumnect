-- 1. Cập nhật tên các ngành hiện có cho khớp chuẩn xác với trường
UPDATE public.majors SET name = 'Digital Marketing' WHERE code = 'MKT';
UPDATE public.majors SET name = 'Tài chính - Ngân hàng' WHERE code = 'FB';
UPDATE public.majors SET name = 'Ngôn ngữ Hàn' WHERE code = 'K';

-- 2. Chuyển đổi dữ liệu tham chiếu của các ngành sắp xóa sang các ngành tương đương
-- BE (Tiếng Anh TM) -> E (Ngôn ngữ Anh)
UPDATE public.user_profiles SET major_id = (SELECT id FROM public.majors WHERE code = 'E')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'BE');
UPDATE public.verification_requests SET major_id = (SELECT id FROM public.majors WHERE code = 'E')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'BE');
UPDATE public.questions SET major_id = (SELECT id FROM public.majors WHERE code = 'E')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'BE');

-- BK (Tiếng Hàn TM) -> K (Ngôn ngữ Hàn)
UPDATE public.user_profiles SET major_id = (SELECT id FROM public.majors WHERE code = 'K')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'BK');
UPDATE public.verification_requests SET major_id = (SELECT id FROM public.majors WHERE code = 'K')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'BK');
UPDATE public.questions SET major_id = (SELECT id FROM public.majors WHERE code = 'K')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'BK');

-- BTC (Tiếng Trung TM) -> C (Ngôn ngữ Trung Quốc)
UPDATE public.user_profiles SET major_id = (SELECT id FROM public.majors WHERE code = 'C')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'BTC');
UPDATE public.verification_requests SET major_id = (SELECT id FROM public.majors WHERE code = 'C')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'BTC');
UPDATE public.questions SET major_id = (SELECT id FROM public.majors WHERE code = 'C')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'BTC');

-- UIUX -> GD (Thiết kế mỹ thuật số)
UPDATE public.user_profiles SET major_id = (SELECT id FROM public.majors WHERE code = 'GD')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'UIUX');
UPDATE public.verification_requests SET major_id = (SELECT id FROM public.majors WHERE code = 'GD')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'UIUX');
UPDATE public.questions SET major_id = (SELECT id FROM public.majors WHERE code = 'GD')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'UIUX');

-- ADS (Khoa học dữ liệu) -> AI (Trí tuệ nhân tạo)
UPDATE public.user_profiles SET major_id = (SELECT id FROM public.majors WHERE code = 'AI')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'ADS');
UPDATE public.verification_requests SET major_id = (SELECT id FROM public.majors WHERE code = 'AI')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'ADS');
UPDATE public.questions SET major_id = (SELECT id FROM public.majors WHERE code = 'AI')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'ADS');

-- EC (Thương mại điện tử) -> MKT (Digital Marketing)
UPDATE public.user_profiles SET major_id = (SELECT id FROM public.majors WHERE code = 'MKT')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'EC');
UPDATE public.verification_requests SET major_id = (SELECT id FROM public.majors WHERE code = 'MKT')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'EC');
UPDATE public.questions SET major_id = (SELECT id FROM public.majors WHERE code = 'MKT')
WHERE major_id = (SELECT id FROM public.majors WHERE code = 'EC');

-- LAW & EL (Luật) -> BA (Quản trị kinh doanh)
UPDATE public.user_profiles SET major_id = (SELECT id FROM public.majors WHERE code = 'BA')
WHERE major_id IN (SELECT id FROM public.majors WHERE code IN ('LAW', 'EL'));
UPDATE public.verification_requests SET major_id = (SELECT id FROM public.majors WHERE code = 'BA')
WHERE major_id IN (SELECT id FROM public.majors WHERE code IN ('LAW', 'EL'));
UPDATE public.questions SET major_id = (SELECT id FROM public.majors WHERE code = 'BA')
WHERE major_id IN (SELECT id FROM public.majors WHERE code IN ('LAW', 'EL'));

-- 3. Xóa bỏ 8 ngành thừa không có trong danh sách đào tạo
DELETE FROM public.majors WHERE code IN ('ADS', 'UIUX', 'BE', 'BK', 'BTC', 'LAW', 'EL', 'EC');

-- 4. Thêm đầy đủ 7 ngành mới còn thiếu
INSERT INTO public.majors (code, name) VALUES
    ('CS', 'Khoa học máy tính'),
    ('ECE', 'Kỹ thuật điện tử, truyền thông'),
    ('TDM', 'Quản trị dịch vụ du lịch & lữ hành'),
    ('GRA', 'Thiết kế đồ hoạ'),
    ('IC', 'Thiết kế vi mạch bán dẫn'),
    ('LOG', 'Logistics Và Quản Trị Chuỗi Cung Ứng'),
    ('ASE', 'Công nghệ Ô tô số')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name;
