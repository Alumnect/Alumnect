-- =====================================================================
-- AlumNect Database Migration - Version 7
-- Add message_type column to messages table for clean system message identification
-- =====================================================================

-- 1. Bổ sung cột message_type vào bảng messages
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS message_type character varying(20) DEFAULT 'TEXT' NOT NULL;

-- 2. Thêm ràng buộc kiểm tra loại tin nhắn hợp lệ
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_messages_message_type'
    ) THEN
        ALTER TABLE public.messages
            ADD CONSTRAINT ck_messages_message_type 
            CHECK (message_type IN ('TEXT', 'SYSTEM', 'IMAGE', 'FILE'));
    END IF;
END $$;

-- 3. Tạo chỉ mục tối ưu hóa truy vấn theo loại tin nhắn
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages USING btree (message_type);

-- 4. Chuẩn hóa các thông báo sự kiện nhóm hiện có trong CSDL sang loại SYSTEM
UPDATE public.messages
SET message_type = 'SYSTEM'
WHERE content ILIKE '%đã tạo nhóm%'
   OR content ILIKE '%đã thêm%vào nhóm%'
   OR content ILIKE '%đã xóa%khỏi nhóm%'
   OR content ILIKE '%đã đổi tên%'
   OR content ILIKE '%đã cập nhật ảnh%'
   OR content ILIKE '%đã rời%'
   OR content ILIKE '%đã chuyển quyền%';
