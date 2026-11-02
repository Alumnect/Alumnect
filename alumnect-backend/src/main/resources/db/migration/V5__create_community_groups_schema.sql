-- =====================================================================
-- V5: Hội nhóm cộng đồng (Community Groups)
-- Gồm 2 bảng: community_groups (hội nhóm) và group_members (thành viên + yêu cầu tham gia).
-- Mỗi người dùng chỉ có đúng 1 dòng trên mỗi nhóm; tham gia / rời / bị từ chối / bị xóa chỉ đổi
-- membership_status trên cùng dòng (cùng cách EventRegistration đang làm) — thỏa BR-03.
-- =====================================================================

CREATE TABLE public.community_groups (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name              VARCHAR(200)   NOT NULL,
    description       TEXT           NOT NULL,
    cover_image_url   VARCHAR(500),
    category          VARCHAR(50)    NOT NULL,
    topics            VARCHAR(50)[],
    privacy           VARCHAR(10)    NOT NULL DEFAULT 'PUBLIC',
    join_rules        TEXT,
    owner_id          BIGINT         NOT NULL,
    member_count      INTEGER        NOT NULL DEFAULT 1,
    status            VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT community_groups_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT ck_groups_privacy      CHECK (privacy IN ('PUBLIC', 'PRIVATE')),
    CONSTRAINT ck_groups_status       CHECK (status IN ('ACTIVE', 'INACTIVE', 'DELETED')),
    CONSTRAINT ck_groups_member_count CHECK (member_count >= 0)
);

CREATE INDEX idx_groups_category ON public.community_groups (category);
CREATE INDEX idx_groups_status   ON public.community_groups (status);
CREATE INDEX idx_groups_owner    ON public.community_groups (owner_id);

CREATE TABLE public.group_members (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id            BIGINT         NOT NULL,
    user_id             BIGINT         NOT NULL,
    role                VARCHAR(10)    NOT NULL DEFAULT 'MEMBER',
    membership_status   VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
    joined_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.community_groups(id) ON DELETE CASCADE,
    CONSTRAINT group_members_user_id_fkey  FOREIGN KEY (user_id)  REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT ck_gm_role   CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    CONSTRAINT ck_gm_status CHECK (membership_status IN ('ACTIVE', 'PENDING', 'REJECTED', 'LEFT', 'REMOVED')),
    CONSTRAINT uq_group_member UNIQUE (group_id, user_id)
);

CREATE INDEX idx_gm_group_status ON public.group_members (group_id, membership_status);
CREATE INDEX idx_gm_user_status  ON public.group_members (user_id, membership_status);

-- =====================================================================
-- Bảng thảo luận / bài viết trong hội nhóm (Group Posts)
-- =====================================================================
CREATE TABLE public.group_posts (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id            BIGINT         NOT NULL,
    author_id           BIGINT         NOT NULL,
    content             TEXT           NOT NULL,
    image_urls          VARCHAR(500)[],
    is_pinned           BOOLEAN        NOT NULL DEFAULT false,
    like_count          INTEGER        NOT NULL DEFAULT 0,
    comment_count       INTEGER        NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT group_posts_group_id_fkey  FOREIGN KEY (group_id)  REFERENCES public.community_groups(id) ON DELETE CASCADE,
    CONSTRAINT group_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)            ON DELETE CASCADE,
    CONSTRAINT ck_group_posts_like_count    CHECK (like_count >= 0),
    CONSTRAINT ck_group_posts_comment_count CHECK (comment_count >= 0)
);

CREATE INDEX idx_group_posts_group_created ON public.group_posts (group_id, created_at DESC);
CREATE INDEX idx_group_posts_author        ON public.group_posts (author_id);

CREATE TABLE public.group_post_likes (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id             BIGINT         NOT NULL,
    user_id             BIGINT         NOT NULL,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT group_post_likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.group_posts(id) ON DELETE CASCADE,
    CONSTRAINT group_post_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)       ON DELETE CASCADE,
    CONSTRAINT uq_group_post_like UNIQUE (post_id, user_id)
);

CREATE INDEX idx_gpl_post_user ON public.group_post_likes (post_id, user_id);

CREATE TABLE public.group_post_comments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id             BIGINT         NOT NULL,
    author_id           BIGINT         NOT NULL,
    content             TEXT           NOT NULL,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),

    CONSTRAINT group_post_comments_post_id_fkey   FOREIGN KEY (post_id)   REFERENCES public.group_posts(id) ON DELETE CASCADE,
    CONSTRAINT group_post_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id)       ON DELETE CASCADE
);

CREATE INDEX idx_gpc_post_created ON public.group_post_comments (post_id, created_at ASC);
CREATE INDEX idx_gpc_author       ON public.group_post_comments (author_id);


