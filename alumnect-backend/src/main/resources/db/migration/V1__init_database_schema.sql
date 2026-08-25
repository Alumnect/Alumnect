-- =====================================================================
-- AlumNect Database Schema & Initial Catalog Data
-- Complete Unified Migration - Version 1 (V1__init_database_schema.sql)
-- Target DBMS: PostgreSQL 14+
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CORE AUTHENTICATION & USER MANAGEMENT TABLES
-- ---------------------------------------------------------------------

-- Roles (Vai trò người dùng: STUDENT, ALUMNI, ADMIN)
CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(20)   NOT NULL UNIQUE
);

-- Majors (Danh mục chuyên ngành đào tạo FPT University)
CREATE TABLE majors (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(20)   NOT NULL UNIQUE,
    name        VARCHAR(150)  NOT NULL
);

-- Users (Tài khoản người dùng trung tâm)
CREATE TABLE users (
    id                  BIGSERIAL PRIMARY KEY,
    email               VARCHAR(255)  NOT NULL UNIQUE,
    password_hash       VARCHAR(255),
    role_id             BIGINT        NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    auth_provider       VARCHAR(50)   NOT NULL DEFAULT 'LOCAL',
    account_status      VARCHAR(50)   NOT NULL DEFAULT 'PENDING',
    email_verified      BOOLEAN       NOT NULL DEFAULT false,
    is_account_verified BOOLEAN       NOT NULL DEFAULT false,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_users_status CHECK (account_status IN ('PENDING', 'ACTIVE', 'WAITING_APPROVAL', 'LOCKED', 'REJECTED')),
    CONSTRAINT ck_users_provider CHECK (auth_provider IN ('LOCAL', 'GOOGLE'))
);

-- User Profiles (Hồ sơ cá nhân công khai 1-1 với Users)
CREATE TABLE user_profiles (
    user_id           BIGINT        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name         VARCHAR(150)  NOT NULL,
    avatar_url        VARCHAR(500),
    cover_url         VARCHAR(500),
    phone             VARCHAR(20),
    major_id          BIGINT        REFERENCES majors(id) ON DELETE SET NULL,
    cohort            INTEGER,
    student_code      VARCHAR(20)   NOT NULL UNIQUE,
    headline          VARCHAR(160),
    biography         TEXT,
    campus            VARCHAR(80),
    graduation_year   INTEGER,
    city              VARCHAR(120),
    social_links      VARCHAR(500)[],
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- User Settings (Cài đặt tùy chọn người dùng 1-1 với Users)
CREATE TABLE user_settings (
    user_id                  BIGINT      PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme                    VARCHAR(20) NOT NULL DEFAULT 'SYSTEM',
    language                 VARCHAR(10) NOT NULL DEFAULT 'vi',
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User OAuth Providers (Liên kết tài khoản mạng xã hội OAuth2 Google)
CREATE TABLE user_oauth_providers (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider         VARCHAR(30)   NOT NULL,
    provider_user_id VARCHAR(120)  NOT NULL,
    linked_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_oauth_provider_user UNIQUE (provider, provider_user_id)
);

-- Verification Tokens (Mã xác thực OTP Email & Reset Password)
CREATE TABLE verification_tokens (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(255)  NOT NULL,
    type            VARCHAR(50)   NOT NULL,
    expires_at      TIMESTAMPTZ   NOT NULL,
    used            BOOLEAN       NOT NULL DEFAULT false,
    failed_attempts INTEGER       NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_token_type CHECK (type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET'))
);

-- Refresh Tokens (Phiên đăng nhập JWT có cơ chế Rotation & Băm SHA-256)
CREATE TABLE refresh_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255)  NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ   NOT NULL,
    revoked    BOOLEAN       NOT NULL DEFAULT false,
    user_agent VARCHAR(500),
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Verification Requests (Phiếu yêu cầu xét duyệt tư cách Cựu sinh viên)
CREATE TABLE verification_requests (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    graduation_year INTEGER       NOT NULL,
    major_id        BIGINT        REFERENCES majors(id) ON DELETE SET NULL,
    proof_url       VARCHAR(500),
    note            VARCHAR(500),
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    reviewed_by     BIGINT        REFERENCES users(id) ON DELETE SET NULL,
    review_note     VARCHAR(500),
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_verification_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- ---------------------------------------------------------------------
-- 2. CAREER, EXPERIENCE & SKILLS TABLES
-- ---------------------------------------------------------------------

-- Experiences (Quá trình công tác, kinh nghiệm làm việc & Tọa độ địa lý bản đồ)
CREATE TABLE experiences (
    id                    BIGSERIAL PRIMARY KEY,
    user_id               BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                 VARCHAR(120)  NOT NULL,
    company               VARCHAR(150)  NOT NULL,
    location              VARCHAR(120),
    start_date            DATE          NOT NULL,
    end_date              DATE,
    is_current            BOOLEAN       NOT NULL DEFAULT false,
    is_primary            BOOLEAN       NOT NULL DEFAULT false,
    latitude              NUMERIC(9,6),
    longitude             NUMERIC(9,6),
    place_id              VARCHAR(255),
    location_city         VARCHAR(120),
    location_country      VARCHAR(120),
    location_country_code VARCHAR(10),
    geocoding_provider    VARCHAR(50),
    description           TEXT,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- User Skills (Kỹ năng của người dùng phân theo nhóm)
CREATE TABLE user_skills (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_name VARCHAR(80)   NOT NULL,
    skill_name VARCHAR(80)   NOT NULL,
    sort_order SMALLINT      NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_skills_user_id_group_name_skill_name UNIQUE (user_id, group_name, skill_name)
);

-- Follows (Mối quan hệ theo dõi giữa các thành viên)
CREATE TABLE follows (
    id           BIGSERIAL   PRIMARY KEY,
    follower_id  BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_follows_follower_following UNIQUE (follower_id, following_id)
);

-- ---------------------------------------------------------------------
-- 3. EVENTS, JOBS & COMMUNITY FEED TABLES
-- ---------------------------------------------------------------------

-- Events (Sự kiện, hội thảo, họp mặt cựu sinh viên)
CREATE TABLE events (
    id             BIGSERIAL PRIMARY KEY,
    organizer_id   BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title          VARCHAR(200)  NOT NULL,
    location       VARCHAR(255),
    start_time     TIMESTAMPTZ   NOT NULL,
    end_time       TIMESTAMPTZ,
    capacity       INTEGER,
    attendee_count INTEGER       NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Job Postings (Tin tuyển dụng việc làm & thực tập)
CREATE TABLE job_postings (
    id            BIGSERIAL PRIMARY KEY,
    poster_id     BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title         VARCHAR(200)   NOT NULL,
    company       VARCHAR(150)   NOT NULL,
    location      VARCHAR(150),
    salary_min    NUMERIC(12,2),
    salary_max    NUMERIC(12,2),
    apply_url     VARCHAR(500),
    contact_email VARCHAR(255),
    purchase_id   BIGINT,
    created_at    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- Posts (Bảng tin cộng đồng hỗ trợ bài viết đa hình)
CREATE TABLE posts (
    id            BIGSERIAL PRIMARY KEY,
    author_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category      VARCHAR(20)   NOT NULL DEFAULT 'GENERAL',
    content       TEXT          NOT NULL,
    status        VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    is_pinned     BOOLEAN       NOT NULL DEFAULT false,
    pinned_at     TIMESTAMPTZ,
    repost_of_id  BIGINT        REFERENCES posts(id) ON DELETE SET NULL,
    event_id      BIGINT        REFERENCES events(id) ON DELETE SET NULL,
    job_id        BIGINT        REFERENCES job_postings(id) ON DELETE SET NULL,
    like_count    INTEGER       NOT NULL DEFAULT 0,
    comment_count INTEGER       NOT NULL DEFAULT 0,
    repost_count  INTEGER       NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_posts_category CHECK (category IN ('GENERAL', 'ACHIEVEMENT', 'RECRUITMENT', 'EVENT')),
    CONSTRAINT ck_posts_status CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED'))
);

-- Post Media (Hình ảnh đính kèm bài viết)
CREATE TABLE post_media (
    id         BIGSERIAL PRIMARY KEY,
    post_id    BIGINT        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    url        VARCHAR(500)  NOT NULL,
    media_type VARCHAR(50)   NOT NULL DEFAULT 'IMAGE',
    sort_order SMALLINT      NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Post Likes (Lượt thích bài viết)
CREATE TABLE post_likes (
    id         BIGSERIAL   PRIMARY KEY,
    post_id    BIGINT      NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_post_likes_post_user UNIQUE (post_id, user_id)
);

-- Comments (Bình luận & phản hồi dưới bài viết)
CREATE TABLE comments (
    id                BIGSERIAL PRIMARY KEY,
    post_id           BIGINT      NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id           BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id BIGINT      REFERENCES comments(id) ON DELETE CASCADE,
    content           TEXT        NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_comments_status CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED'))
);

-- ---------------------------------------------------------------------
-- 4. Q&A FORUM TABLES
-- ---------------------------------------------------------------------

-- Forum Topics (Chủ đề / Danh mục diễn đàn hỏi đáp)
CREATE TABLE forum_topics (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL UNIQUE,
    description VARCHAR(500),
    created_by  BIGINT        REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Questions (Câu hỏi trên diễn đàn Q&A)
CREATE TABLE questions (
    id           BIGSERIAL PRIMARY KEY,
    author_id    BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id     BIGINT        REFERENCES forum_topics(id) ON DELETE SET NULL,
    major_id     BIGINT        REFERENCES majors(id) ON DELETE SET NULL,
    title        VARCHAR(250)  NOT NULL,
    body         TEXT          NOT NULL,
    status       VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    vote_count   INTEGER       NOT NULL DEFAULT 0,
    answer_count INTEGER       NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_questions_status CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED'))
);

-- Question Images (Hình ảnh đính kèm câu hỏi)
CREATE TABLE question_images (
    id          BIGSERIAL PRIMARY KEY,
    question_id BIGINT        NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    url         VARCHAR(500)  NOT NULL,
    sort_order  SMALLINT      NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Answers (Câu trả lời & phản hồi trên diễn đàn Q&A)
CREATE TABLE answers (
    id          BIGSERIAL PRIMARY KEY,
    question_id BIGINT      NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    author_id   BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id   BIGINT      REFERENCES answers(id) ON DELETE CASCADE,
    body        TEXT        NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    vote_count  INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_answers_status CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED'))
);

-- ---------------------------------------------------------------------
-- 5. PERFORMANCE INDEXES
-- ---------------------------------------------------------------------

CREATE INDEX idx_users_role_id ON users (role_id);
CREATE INDEX idx_users_account_status ON users (account_status);
CREATE INDEX idx_users_email ON users (email);

CREATE INDEX idx_user_profiles_major_id ON user_profiles (major_id);
CREATE INDEX idx_user_profiles_student_code ON user_profiles (student_code);

CREATE INDEX idx_verification_tokens_user_id_type ON verification_tokens (user_id, type);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

CREATE INDEX idx_verification_requests_status ON verification_requests (status);
CREATE INDEX idx_verification_requests_user_id ON verification_requests (user_id);

CREATE INDEX idx_experiences_user_id ON experiences (user_id);
CREATE INDEX idx_experiences_primary_current ON experiences (user_id, is_primary, is_current);
CREATE INDEX idx_experiences_latitude_longitude ON experiences (latitude, longitude);

CREATE INDEX idx_user_skills_user_id ON user_skills (user_id);

CREATE INDEX idx_posts_author_id ON posts (author_id);
CREATE INDEX idx_posts_category ON posts (category);
CREATE INDEX idx_posts_status_created_at ON posts (status, created_at DESC);

CREATE INDEX idx_post_media_post_id ON post_media (post_id);
CREATE INDEX idx_comments_post_id ON comments (post_id);
CREATE INDEX idx_comments_user_id ON comments (user_id);

CREATE INDEX idx_questions_author_id ON questions (author_id);
CREATE INDEX idx_questions_topic_id ON questions (topic_id);
CREATE INDEX idx_questions_major_id ON questions (major_id);
CREATE INDEX idx_questions_status_created_at ON questions (status, created_at DESC);

CREATE INDEX idx_answers_question_id ON answers (question_id);
CREATE INDEX idx_answers_author_id ON answers (author_id);

-- ---------------------------------------------------------------------
-- 6. INITIAL CATALOG SEED DATA
-- ---------------------------------------------------------------------

-- Roles
INSERT INTO roles (id, name) VALUES
(1, 'STUDENT'),
(2, 'ALUMNI'),
(3, 'ADMIN')
ON CONFLICT (name) DO NOTHING;

-- Majors (24 chuyên ngành đào tạo của FPT University)
INSERT INTO majors (code, name) VALUES
-- Khối ngành Công nghệ thông tin
('SE',  'Kỹ thuật phần mềm (Software Engineering)'),
('IA',  'An toàn thông tin (Information Assurance)'),
('AI',  'Trí tuệ nhân tạo (Artificial Intelligence)'),
('IS',  'Hệ thống thông tin (Information Systems)'),
('IT',  'Công nghệ thông tin'),
('ADS', 'Khoa học dữ liệu (Applied Data Science)'),
-- Khối ngành Thiết kế & Mỹ thuật số
('GD',  'Thiết kế mỹ thuật số (Graphic & Digital Design)'),
('UIUX','Thiết kế trải nghiệm người dùng (UI/UX Design)'),
-- Khối ngành Truyền thông
('MC',  'Truyền thông đa phương tiện (Multimedia Communication)'),
('PR',  'Quan hệ công chúng (Public Relations)'),
-- Khối ngành Ngôn ngữ
('E',   'Ngôn ngữ Anh'),
('BE',  'Tiếng Anh thương mại'),
('K',   'Ngôn ngữ Hàn Quốc'),
('BK',  'Tiếng Hàn thương mại'),
('C',   'Ngôn ngữ Trung Quốc'),
('BTC', 'Tiếng Trung thương mại'),
('J',   'Ngôn ngữ Nhật'),
-- Khối ngành Luật
('LAW', 'Luật'),
('EL',  'Luật kinh tế'),
-- Khối ngành Quản trị kinh doanh & Tài chính
('MKT', 'Marketing'),
('IB',  'Kinh doanh quốc tế'),
('EC',  'Thương mại điện tử'),
('BA',  'Quản trị kinh doanh'),
('HM',  'Quản trị khách sạn'),
('FB',  'Tài chính ngân hàng')
ON CONFLICT (code) DO NOTHING;

-- Forum Topics
INSERT INTO forum_topics (name, description) VALUES
('Career',      'Định hướng nghề nghiệp, chuyển ngành, phát triển sự nghiệp'),
('Interview',   'Kinh nghiệm phỏng vấn, luyện thuật toán, system design'),
('Education',   'Học tập, chứng chỉ, học bổng, học lên cao'),
('Salary',      'Thảo luận về lương thưởng, đãi ngộ, thương lượng'),
('General',     'Các chủ đề chung khác của cộng đồng cựu sinh viên')
ON CONFLICT (name) DO NOTHING;
