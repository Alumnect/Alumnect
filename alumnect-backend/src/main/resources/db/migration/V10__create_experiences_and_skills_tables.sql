-- V10__create_experiences_and_skills_tables.sql
-- Khởi tạo bảng experiences (Kinh nghiệm làm việc)
CREATE TABLE IF NOT EXISTS experiences (
    id           BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      BIGINT        NOT NULL,
    title        VARCHAR(120)  NOT NULL,
    company      VARCHAR(150)  NOT NULL,
    location     VARCHAR(120),
    start_date   DATE          NOT NULL,
    end_date     DATE,
    is_current   BOOLEAN       NOT NULL DEFAULT false,
    description  TEXT,
    created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_experiences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Khởi tạo bảng user_skills (Kỹ năng của người dùng)
CREATE TABLE IF NOT EXISTS user_skills (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT       NOT NULL,
    group_name  VARCHAR(80)  NOT NULL,
    skill_name  VARCHAR(80)  NOT NULL,
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_skills_user_id_group_name_skill_name UNIQUE (user_id, group_name, skill_name),
    CONSTRAINT fk_user_skills_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
