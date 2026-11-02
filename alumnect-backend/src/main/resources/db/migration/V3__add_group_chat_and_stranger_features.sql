-- =====================================================================
-- AlumNect Database Migration - Version 3
-- Add Group Chat, Stranger Messaging (Message Requests), and Clean Up Empty Conversations
-- =====================================================================

-- 1. Bổ sung các cột phục vụ Nhắn tin nhóm và người lạ vào bảng conversations
ALTER TABLE public.conversations
    ADD COLUMN IF NOT EXISTS type character varying(20) DEFAULT 'DIRECT' NOT NULL,
    ADD COLUMN IF NOT EXISTS title character varying(255),
    ADD COLUMN IF NOT EXISTS avatar_url character varying(500),
    ADD COLUMN IF NOT EXISTS created_by bigint;

-- Thêm ràng buộc kiểm tra loại cuộc hội thoại
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_conversations_type'
    ) THEN
        ALTER TABLE public.conversations
            ADD CONSTRAINT ck_conversations_type CHECK (type IN ('DIRECT', 'GROUP'));
    END IF;
END $$;

-- Thêm khóa ngoại người tạo cuộc hội thoại
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversations_created_by'
    ) THEN
        ALTER TABLE public.conversations
            ADD CONSTRAINT fk_conversations_created_by FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Bổ sung các cột vai trò và trạng thái chấp nhận vào bảng conversation_participants
ALTER TABLE public.conversation_participants
    ADD COLUMN IF NOT EXISTS role character varying(20) DEFAULT 'MEMBER' NOT NULL,
    ADD COLUMN IF NOT EXISTS is_accepted boolean DEFAULT true NOT NULL;

-- Thêm ràng buộc kiểm tra vai trò thành viên
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ck_conversation_participants_role'
    ) THEN
        ALTER TABLE public.conversation_participants
            ADD CONSTRAINT ck_conversation_participants_role CHECK (role IN ('ADMIN', 'MEMBER'));
    END IF;
END $$;

-- 3. Tạo chỉ mục tối ưu hóa hiệu năng truy vấn
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations USING btree (type);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_accepted ON public.conversation_participants USING btree (user_id, is_accepted);

-- 4. Dọn dẹp triệt để các cuộc hội thoại rỗng mồ côi (chưa có tin nhắn nào)
DELETE FROM public.conversations
WHERE id NOT IN (
    SELECT DISTINCT conversation_id FROM public.messages
);
