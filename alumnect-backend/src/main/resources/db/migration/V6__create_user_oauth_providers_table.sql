-- Flyway Migration: Create user_oauth_providers table for external OAuth identities

CREATE TABLE user_oauth_providers (
    id                BIGINT        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id           BIGINT        NOT NULL,
    provider          VARCHAR(30)   NOT NULL,
    provider_user_id  VARCHAR(120)  NOT NULL,
    linked_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_oauth_providers_provider_provider_user_id UNIQUE (provider, provider_user_id)
);

-- Ràng buộc khóa ngoại trỏ tới bảng users
ALTER TABLE user_oauth_providers ADD CONSTRAINT fk_user_oauth_providers_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Chỉ mục để tối ưu hóa truy vấn theo user_id và cặp provider
CREATE INDEX idx_user_oauth_providers_user_id ON user_oauth_providers (user_id);
CREATE INDEX idx_user_oauth_providers_provider_user_id ON user_oauth_providers (provider, provider_user_id);
