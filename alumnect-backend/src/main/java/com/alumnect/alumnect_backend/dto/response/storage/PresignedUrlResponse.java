package com.alumnect.alumnect_backend.dto.response.storage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin phản hồi khi yêu cầu sinh link ký sẵn (Presigned URL) từ Cloudflare R2.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PresignedUrlResponse {

    /** Đường dẫn PUT tạm thời dùng để upload trực tiếp từ máy khách (Frontend) lên Cloudflare R2 */
    private String uploadUrl;

    /** Đường dẫn GET tĩnh, công khai để xem tệp và lưu vào cơ sở dữ liệu (Database) */
    private String publicUrl;
}
