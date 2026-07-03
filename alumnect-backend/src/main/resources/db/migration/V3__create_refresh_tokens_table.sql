-- Flyway Migration: Create refresh_tokens table for security token rotation and revocation

CREATE TABLE refresh_tokens (
    id          BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     BIGINT        NOT NULL,
    token_hash  VARCHAR(255)  NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ   NOT NULL,
    revoked     BOOLEAN       NOT NULL DEFAULT FALSE,
    user_agent  VARCHAR(255),
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Ràng buộc khóa ngoại trỏ tới bảng users
ALTER TABLE refresh_tokens ADD CONSTRAINT fk_refresh_tokens_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Chỉ mục để tối ưu hóa truy vấn theo user_id
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);
