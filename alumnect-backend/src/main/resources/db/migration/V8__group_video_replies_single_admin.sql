ALTER TABLE public.group_posts ADD COLUMN topic VARCHAR(50);

CREATE INDEX idx_group_posts_group_topic_recent
    ON public.group_posts (group_id, topic, is_pinned DESC, created_at DESC);

ALTER TABLE public.group_posts ADD COLUMN video_urls VARCHAR(500)[];

ALTER TABLE public.group_post_comments
    ADD COLUMN parent_comment_id BIGINT REFERENCES public.group_post_comments(id) ON DELETE CASCADE;
CREATE INDEX idx_gpc_parent ON public.group_post_comments (parent_comment_id);

-- Giữ vai trò của owner khớp với community_groups.owner_id trước khi áp dụng ràng buộc.
UPDATE public.group_members gm
SET role = 'MEMBER'
FROM public.community_groups g
WHERE gm.group_id = g.id AND gm.role = 'OWNER' AND gm.user_id <> g.owner_id;

UPDATE public.group_members gm
SET role = 'OWNER'
FROM public.community_groups g
WHERE gm.group_id = g.id AND gm.user_id = g.owner_id AND gm.membership_status = 'ACTIVE';

CREATE UNIQUE INDEX uq_gm_one_active_owner
    ON public.group_members (group_id) WHERE role = 'OWNER' AND membership_status = 'ACTIVE';
CREATE UNIQUE INDEX uq_gm_one_active_admin
    ON public.group_members (group_id) WHERE role = 'ADMIN' AND membership_status = 'ACTIVE';
