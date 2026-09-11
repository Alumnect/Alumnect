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

-- Verification Tokens (Mã OTP xác thực email, quên mật khẩu)
CREATE TABLE verification_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(100)  NOT NULL,
    type        VARCHAR(50)   NOT NULL,
    expiry_date TIMESTAMPTZ   NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_verification_tokens_type CHECK (type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET'))
);

-- Refresh Tokens (Quản lý phiên đăng nhập JWT Refresh Token)
CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255)  NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ   NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    revoked     BOOLEAN       NOT NULL DEFAULT false
);

-- Verification Requests (Yêu cầu xét duyệt nâng cấp tài khoản Cựu sinh viên)
CREATE TABLE verification_requests (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_url VARCHAR(500)  NOT NULL,
    status       VARCHAR(50)   NOT NULL DEFAULT 'PENDING',
    admin_notes  TEXT,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_verification_requests_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- Experiences (Kinh nghiệm làm việc & định vị bản đồ Alumni Map)
CREATE TABLE experiences (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company     VARCHAR(150)  NOT NULL,
    title       VARCHAR(150)  NOT NULL,
    location    VARCHAR(150),
    is_current  BOOLEAN       NOT NULL DEFAULT false,
    start_date  DATE          NOT NULL,
    end_date    DATE,
    description TEXT,
    is_primary  BOOLEAN       NOT NULL DEFAULT false,
    latitude    DECIMAL(10,8),
    longitude   DECIMAL(11,8),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_experiences_date_range CHECK (end_date IS NULL OR end_date >= start_date)
);

-- User Skills (Kỹ năng chuyên môn của người dùng)
CREATE TABLE user_skills (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_name  VARCHAR(80)   NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_skills_user_skill UNIQUE (user_id, skill_name)
);

-- ---------------------------------------------------------------------
-- 2. COMMUNITY FEED, POSTS, MEDIA, INTERACTIONS & REPORTS
-- ---------------------------------------------------------------------

-- Posts (Bảng tin chia sẻ, tuyển dụng, sự kiện, thành tựu)
CREATE TABLE posts (
    id            BIGSERIAL PRIMARY KEY,
    author_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content       TEXT          NOT NULL,
    category      VARCHAR(50)   NOT NULL,
    status        VARCHAR(50)   NOT NULL DEFAULT 'ACTIVE',
    like_count    INTEGER       NOT NULL DEFAULT 0,
    comment_count INTEGER       NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_posts_category CHECK (category IN ('GENERAL', 'RECRUITMENT', 'EVENT', 'ACHIEVEMENT')),
    CONSTRAINT ck_posts_status CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED'))
);

-- Post Media (Hình ảnh đính kèm bài viết, tải lên Cloudflare R2)
CREATE TABLE post_media (
    id            BIGSERIAL PRIMARY KEY,
    post_id       BIGINT        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    media_url     VARCHAR(500)  NOT NULL,
    media_type    VARCHAR(50)   NOT NULL DEFAULT 'IMAGE',
    display_order INTEGER       NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_post_media_type CHECK (media_type IN ('IMAGE'))
);

-- Likes (Lượt thích bài viết)
CREATE TABLE likes (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_likes_post_user UNIQUE (post_id, user_id)
);

-- Comments (Bình luận bài viết)
CREATE TABLE comments (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT          NOT NULL,
    status      VARCHAR(50)   NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_comments_status CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED'))
);

-- Reports (Báo cáo bài viết vi phạm tiêu chuẩn cộng đồng)
CREATE TABLE reports (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reporter_id BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason      VARCHAR(30)   NOT NULL,
    description VARCHAR(500),
    status      VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_reports_reason CHECK (reason IN ('SPAM', 'INAPPROPRIATE', 'MISINFORMATION', 'SCAM_OR_FRAUD', 'OTHER')),
    CONSTRAINT ck_reports_status CHECK (status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
    CONSTRAINT ck_reports_other_description CHECK (reason <> 'OTHER' OR (description IS NOT NULL AND char_length(trim(description)) > 0))
);

-- Post Saves (Đánh dấu lưu bài viết cá nhân Bookmark)
CREATE TABLE post_saves (
    id          BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id     BIGINT        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_post_saves_post_user UNIQUE (post_id, user_id)
);

-- Follows (Mạng lưới quan hệ theo dõi thành viên)
CREATE TABLE follows (
    id           BIGSERIAL PRIMARY KEY,
    follower_id  BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_follows_pair UNIQUE (follower_id, following_id),
    CONSTRAINT ck_follows_no_self CHECK (follower_id != following_id)
);

-- ---------------------------------------------------------------------
-- 3. EVENTS & EVENT REGISTRATIONS (RSVP)
-- ---------------------------------------------------------------------

-- Events (Sự kiện cựu sinh viên, hội thảo, giao lưu kết nối)
CREATE TABLE events (
    id          BIGSERIAL PRIMARY KEY,
    creator_id  BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200)  NOT NULL,
    description TEXT          NOT NULL,
    location    VARCHAR(255)  NOT NULL,
    start_time  TIMESTAMPTZ   NOT NULL,
    end_time    TIMESTAMPTZ   NOT NULL,
    banner_url  VARCHAR(500),
    status      VARCHAR(20)   NOT NULL DEFAULT 'ACTIVE',
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_events_time CHECK (end_time > start_time),
    CONSTRAINT ck_events_status CHECK (status IN ('ACTIVE', 'CANCELLED'))
);

-- Event Registrations (Đăng ký tham gia sự kiện RSVP)
CREATE TABLE event_registrations (
    id         BIGSERIAL   PRIMARY KEY,
    event_id   BIGINT      NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_event_registrations_event_user UNIQUE (event_id, user_id),
    CONSTRAINT ck_event_registrations_status CHECK (status IN ('REGISTERED', 'CANCELLED'))
);

-- ---------------------------------------------------------------------
-- 4. DIRECT MESSAGING & 1-1 CHAT
-- ---------------------------------------------------------------------

-- Conversations (Cuộc hội thoại trò chuyện 1-1)
CREATE TABLE conversations (
    id               BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    direct_key       VARCHAR(100) UNIQUE,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_message_at  TIMESTAMPTZ
);

-- Conversation Participants (Thành viên tham gia hội thoại & trạng thái đọc)
CREATE TABLE conversation_participants (
    id                    BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id       BIGINT       NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id               BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_message_id  BIGINT,
    is_archived           BOOLEAN      NOT NULL DEFAULT false,
    joined_at             TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversation_participants_conv_user UNIQUE (conversation_id, user_id)
);

-- Messages (Tin nhắn trong cuộc hội thoại)
CREATE TABLE messages (
    id               BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversation_id  BIGINT       NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id        BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content          TEXT,
    is_deleted       BOOLEAN      NOT NULL DEFAULT false,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Khóa ngoại bổ sung cho last_read_message_id tham chiếu tới messages
ALTER TABLE conversation_participants
    ADD CONSTRAINT fk_conversation_participants_last_read_message_id
    FOREIGN KEY (last_read_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Message Attachments (Tệp đính kèm hình ảnh, video, tài liệu)
CREATE TABLE message_attachments (
    id          BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    message_id  BIGINT        NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    media_type  VARCHAR(10)   NOT NULL DEFAULT 'FILE',
    url         VARCHAR(500)  NOT NULL,
    file_name   VARCHAR(255),
    file_size   BIGINT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_message_attachments_media_type CHECK (media_type IN ('IMAGE', 'VIDEO', 'FILE'))
);

-- ---------------------------------------------------------------------
-- 5. NOTIFICATIONS & SYSTEM BROADCASTS
-- ---------------------------------------------------------------------

-- System Notifications (Thông báo phát sóng toàn hệ thống do Quản trị viên gửi)
CREATE TABLE system_notifications (
    id                  BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title               VARCHAR(255)  NOT NULL,
    content             TEXT          NOT NULL,
    recipient_type      VARCHAR(50)   NOT NULL,
    recipient_role      VARCHAR(50),
    recipient_user_id   BIGINT        REFERENCES users(id) ON DELETE SET NULL,
    status              VARCHAR(50)   NOT NULL DEFAULT 'DRAFT',
    duration_type       VARCHAR(50)   NOT NULL,
    scheduled_at        TIMESTAMPTZ,
    sent_at             TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    archived_at         TIMESTAMPTZ,
    created_by          BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_system_notif_recipient_type CHECK (recipient_type IN ('SPECIFIC_USER', 'USER_ROLE', 'ALL_USERS')),
    CONSTRAINT ck_system_notif_status CHECK (status IN ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'ACTIVE', 'EXPIRED', 'ARCHIVED', 'CANCELLED')),
    CONSTRAINT ck_system_notif_duration CHECK (duration_type IN ('ONE_DAY', 'ONE_WEEK', 'ONE_MONTH', 'ONE_YEAR', 'FOREVER', 'CUSTOM'))
);

-- Notifications (Thông báo thời gian thực gửi tới từng người dùng)
CREATE TABLE notifications (
    id                     BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipient_id           BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id              BIGINT        REFERENCES users(id) ON DELETE SET NULL,
    type                   VARCHAR(50)   NOT NULL,
    title                  VARCHAR(255),
    content                TEXT          NOT NULL,
    target_type            VARCHAR(50),
    target_id              VARCHAR(100),
    sender_count           INT           NOT NULL DEFAULT 1,
    is_read                BOOLEAN       NOT NULL DEFAULT false,
    expires_at             TIMESTAMPTZ,
    system_notification_id BIGINT        REFERENCES system_notifications(id) ON DELETE CASCADE,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT ck_notifications_type CHECK (type IN ('POST_LIKE', 'POST_COMMENT', 'USER_FOLLOW', 'FORUM_ANSWER', 'REPORT_RESOLVED', 'WELCOME', 'SYSTEM_BROADCAST'))
);

-- ---------------------------------------------------------------------
-- 6. SALARY BOARD & CAREER CONTRIBUTIONS
-- ---------------------------------------------------------------------

-- Industries (Danh mục lĩnh vực ngành nghề)
CREATE TABLE industries (
    id   BIGSERIAL     PRIMARY KEY,
    name VARCHAR(120)  NOT NULL UNIQUE
);

-- Salary Contributions (Khảo sát thu nhập cựu sinh viên đóng góp ẩn danh)
CREATE TABLE salary_contributions (
    id               BIGSERIAL      PRIMARY KEY,
    user_id          BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    industry_id      BIGINT         REFERENCES industries(id) ON DELETE SET NULL,
    job_title        VARCHAR(150)   NOT NULL,
    company          VARCHAR(150),
    region           VARCHAR(120),
    years_experience SMALLINT,
    gross_amount     NUMERIC(12,2)  NOT NULL,
    currency         VARCHAR(3)     NOT NULL DEFAULT 'VND',
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 7. Q&A FORUM (TOPICS, QUESTIONS, ANSWERS, VOTES)
-- ---------------------------------------------------------------------

-- Forum Topics (Chủ đề diễn đàn hỏi đáp)
CREATE TABLE forum_topics (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100)  NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Questions (Câu hỏi diễn đàn)
CREATE TABLE questions (
    id           BIGSERIAL PRIMARY KEY,
    topic_id     BIGINT      NOT NULL REFERENCES forum_topics(id) ON DELETE RESTRICT,
    author_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    major_id     BIGINT      REFERENCES majors(id) ON DELETE SET NULL,
    title        VARCHAR(255) NOT NULL,
    content      TEXT        NOT NULL,
    status       VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    view_count   INTEGER     NOT NULL DEFAULT 0,
    answer_count INTEGER     NOT NULL DEFAULT 0,
    vote_count   INTEGER     NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_questions_status CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED'))
);

-- Answers (Câu trả lời cho câu hỏi)
CREATE TABLE answers (
    id          BIGSERIAL PRIMARY KEY,
    question_id BIGINT      NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    author_id   BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT        NOT NULL,
    is_accepted BOOLEAN     NOT NULL DEFAULT false,
    status      VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    vote_count  INTEGER     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_answers_status CHECK (status IN ('ACTIVE', 'HIDDEN', 'DELETED'))
);

-- Votes (Bình chọn câu hỏi / câu trả lời trên diễn đàn)
CREATE TABLE votes (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(10) NOT NULL,
    target_id   BIGINT      NOT NULL,
    value       SMALLINT    NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_votes_user_target UNIQUE (user_id, target_type, target_id),
    CONSTRAINT ck_votes_value CHECK (value IN (-1, 1)),
    CONSTRAINT ck_votes_target_type CHECK (target_type IN ('QUESTION', 'ANSWER'))
);

-- ---------------------------------------------------------------------
-- 8. PERFORMANCE INDEXES
-- ---------------------------------------------------------------------

-- Users & Profiles
CREATE INDEX idx_users_role_id ON users (role_id);
CREATE INDEX idx_users_account_status ON users (account_status);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_user_profiles_major_id ON user_profiles (major_id);
CREATE INDEX idx_user_profiles_student_code ON user_profiles (student_code);
CREATE INDEX idx_user_profiles_full_name ON user_profiles (full_name);
CREATE INDEX idx_user_profiles_cohort ON user_profiles (cohort);
CREATE INDEX idx_user_profiles_city ON user_profiles (city);
CREATE INDEX idx_user_profiles_major_cohort ON user_profiles (major_id, cohort);

-- Tokens & Verification
CREATE INDEX idx_verification_tokens_user_id_type ON verification_tokens (user_id, type);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests (status);
CREATE INDEX idx_verification_requests_user_id ON verification_requests (user_id);

-- Experiences & Skills
CREATE INDEX idx_experiences_user_id ON experiences (user_id);
CREATE INDEX idx_experiences_primary_current ON experiences (user_id, is_primary, is_current);
CREATE INDEX idx_experiences_latitude_longitude ON experiences (latitude, longitude);
CREATE INDEX idx_experiences_company ON experiences (company);
CREATE INDEX idx_experiences_title ON experiences (title);
CREATE INDEX idx_user_skills_user_id ON user_skills (user_id);
CREATE INDEX idx_user_skills_skill_name ON user_skills (skill_name);

-- Posts, Media, Comments, Likes, Reports, Post Saves, Follows
CREATE INDEX idx_posts_author_id ON posts (author_id);
CREATE INDEX idx_posts_category ON posts (category);
CREATE INDEX idx_posts_status_created_at ON posts (status, created_at DESC);
CREATE INDEX idx_post_media_post_id ON post_media (post_id);
CREATE INDEX idx_comments_post_id ON comments (post_id);
CREATE INDEX idx_comments_user_id ON comments (user_id);
CREATE INDEX idx_reports_post_id ON reports (post_id);
CREATE INDEX idx_reports_reporter_id_created_at ON reports (reporter_id, created_at DESC);
CREATE INDEX idx_post_saves_user_id ON post_saves (user_id);
CREATE INDEX idx_post_saves_post_id ON post_saves (post_id);
CREATE INDEX idx_post_saves_user_created_at ON post_saves (user_id, created_at DESC);
CREATE INDEX idx_follows_follower_id ON follows (follower_id);
CREATE INDEX idx_follows_following_id ON follows (following_id);

-- Events & Registrations
CREATE INDEX idx_events_status ON events (status);
CREATE INDEX idx_event_registrations_event_id ON event_registrations (event_id);
CREATE INDEX idx_event_registrations_user_id ON event_registrations (user_id);

-- Conversations & Chat
CREATE INDEX idx_conversations_direct_key ON conversations (direct_key);
CREATE INDEX idx_conversations_last_message_at ON conversations (last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants (user_id);
CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants (conversation_id);
CREATE INDEX idx_messages_conversation_id_created_at ON messages (conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender_id ON messages (sender_id);
CREATE INDEX idx_message_attachments_message_id ON message_attachments (message_id);

-- Notifications
CREATE INDEX idx_sys_notif_created_at ON system_notifications (created_at DESC);
CREATE INDEX idx_sys_notif_status ON system_notifications (status);
CREATE INDEX idx_sys_notif_scheduled ON system_notifications (status, scheduled_at);
CREATE INDEX idx_sys_notif_expires ON system_notifications (status, expires_at);
CREATE INDEX idx_sys_notif_archived_at ON system_notifications (archived_at);
CREATE INDEX idx_notifications_recipient_read ON notifications (recipient_id, is_read);
CREATE INDEX idx_notifications_recipient_created ON notifications (recipient_id, created_at DESC);
CREATE INDEX idx_notifications_grouping ON notifications (recipient_id, type, target_type, target_id, is_read);
CREATE INDEX idx_notifications_recipient_expires ON notifications (recipient_id, expires_at);

-- Salary Board
CREATE INDEX idx_salary_contributions_industry_id ON salary_contributions (industry_id);
CREATE INDEX idx_salary_contributions_user_id ON salary_contributions (user_id);

-- Forum Q&A
CREATE INDEX idx_questions_author_id ON questions (author_id);
CREATE INDEX idx_questions_topic_id ON questions (topic_id);
CREATE INDEX idx_questions_major_id ON questions (major_id);
CREATE INDEX idx_questions_status_created_at ON questions (status, created_at DESC);
CREATE INDEX idx_answers_question_id ON answers (question_id);
CREATE INDEX idx_answers_author_id ON answers (author_id);
CREATE INDEX idx_votes_target_type_target_id ON votes (target_type, target_id);

-- ---------------------------------------------------------------------
-- 9. INITIAL CATALOG SEED DATA
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
('SE',  'Kỹ thuật phần mềm'),
('IA',  'An toàn thông tin'),
('AI',  'Trí tuệ nhân tạo'),
('IS',  'Hệ thống thông tin'),
('IT',  'Công nghệ thông tin'),
('ADS', 'Khoa học dữ liệu'),
-- Khối ngành Thiết kế & Mỹ thuật số
('GD',  'Thiết kế mỹ thuật số'),
('UIUX','Thiết kế trải nghiệm người dùng'),
-- Khối ngành Truyền thông
('MC',  'Truyền thông đa phương tiện'),
('PR',  'Quan hệ công chúng'),
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
('Sự nghiệp', 'Định hướng nghề nghiệp, chuyên ngành, phát triển sự nghiệp'),
('Kinh nghiệm phỏng vấn',  'Kinh nghiệm phỏng vấn'),
('Học tập',                'Học tập, chứng chỉ, học bổng, học lên cao'),
('Lương',        'Thảo luận về lương thưởng, đãi ngộ, thương lượng'),
('Chủ đề chung',           'Các chủ đề chung khác của cộng đồng')
ON CONFLICT (name) DO NOTHING;

-- Industries (11 danh mục ngành nghề đối chiếu với FPTU)
INSERT INTO industries (name) VALUES
('Công nghệ thông tin'),
('Tài chính - Ngân hàng'),
('Marketing - Thương mại điện tử'),
('Thiết kế - Sáng tạo'),
('Truyền thông - Quan hệ công chúng'),
('Ngôn ngữ - Biên phiên dịch'),
('Luật'),
('Kinh doanh - Quản trị'),
('Du lịch - Khách sạn'),
('Giáo dục - Đào tạo'),
('Khác')
ON CONFLICT (name) DO NOTHING;
