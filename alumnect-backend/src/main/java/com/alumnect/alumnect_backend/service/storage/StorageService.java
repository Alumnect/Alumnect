package com.alumnect.alumnect_backend.service.storage;

import com.alumnect.alumnect_backend.dto.response.storage.PresignedUrlResponse;

/**
 * Interface định nghĩa các nghiệp vụ liên quan đến lưu trữ tệp tin (Cloud Storage).
 */
public interface StorageService {

    /**
     * Sinh link ký sẵn (Presigned URL) hỗ trợ client tự tải tệp tin lên Cloudflare R2 qua giao thức S3.
     *
     * @param fileName Tên tệp tin gốc của người dùng gửi lên
     * @param contentType Kiểu MIME của tệp tin (VD: image/jpeg, application/pdf...)
     * @param folder Thư mục đích phân loại trên R2 (VD: proofs, avatars...)
     * @return PresignedUrlResponse chứa đường dẫn upload và đường dẫn công khai
     */
    PresignedUrlResponse generatePresignedUploadUrl(String fileName, String contentType, String folder);
}
