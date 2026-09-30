ALTER TABLE public.group_posts ADD COLUMN topic VARCHAR(50);

CREATE INDEX idx_group_posts_group_topic_recent
    ON public.group_posts (group_id, topic, is_pinned DESC, created_at DESC);
