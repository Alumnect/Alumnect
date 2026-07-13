-- V9__add_cover_url_to_user_profiles.sql
-- Thêm cột cover_url (đường dẫn ảnh bìa) vào bảng user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cover_url VARCHAR(500);

-- Thêm cột social_links kiểu mảng VARCHAR(500)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS social_links VARCHAR(500)[];

-- Di cư dữ liệu cũ từ website_url và linkedin_url vào mảng social_links
UPDATE user_profiles
SET social_links = ARRAY[
    CASE WHEN website_url IS NOT NULL AND website_url <> '' THEN website_url ELSE NULL END,
    CASE WHEN linkedin_url IS NOT NULL AND linkedin_url <> '' THEN linkedin_url ELSE NULL END
]::VARCHAR(500)[]
WHERE (website_url IS NOT NULL AND website_url <> '') OR (linkedin_url IS NOT NULL AND linkedin_url <> '');

-- Dọn dẹp phần tử NULL trong mảng
UPDATE user_profiles
SET social_links = array_remove(social_links, NULL)
WHERE social_links IS NOT NULL;

-- Xóa các cột cũ khỏi bảng user_profiles
ALTER TABLE user_profiles
    DROP COLUMN IF EXISTS current_position,
    DROP COLUMN IF EXISTS current_company,
    DROP COLUMN IF EXISTS website_url,
    DROP COLUMN IF EXISTS linkedin_url;
