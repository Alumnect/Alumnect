package com.alumnect.alumnect_backend.service.storage;

import com.alumnect.alumnect_backend.dto.response.storage.PresignedUrlResponse;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.net.URI;
import java.time.Duration;
import java.util.UUID;

/**
 * Lớp dịch vụ thực thi StorageService kết nối tới Cloudflare R2 qua giao thức tương thích S3.
 * Sử dụng S3Presigner để sinh link ký sẵn (Presigned URL) cho phép tải tệp trực tiếp từ client.
 */
@Service
public class S3StorageServiceImpl implements StorageService {

    @Value("${app.r2.endpoint}")
    private String endpoint;

    @Value("${app.r2.access-key}")
    private String accessKey;

    @Value("${app.r2.secret-key}")
    private String secretKey;

    @Value("${app.r2.bucket-name}")
    private String bucketName;

    @Value("${app.r2.public-url}")
    private String publicUrl;

    private S3Presigner s3Presigner;

    /**
     * Khởi tạo S3Presigner sau khi các bean dependency được tiêm cấu hình thành công.
     */
    @PostConstruct
    public void init() {
        s3Presigner = S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                ))
                .region(Region.US_EAST_1) // Cloudflare R2 bỏ qua Region, nhưng SDK yêu cầu nên gán mặc định US_EAST_1
                .build();
    }

    /**
     * Giải phóng tài nguyên s3Presigner khi ứng dụng dừng hoạt động.
     */
    @PreDestroy
    public void cleanup() {
        if (s3Presigner != null) {
            s3Presigner.close();
        }
    }

    @Override
    public PresignedUrlResponse generatePresignedUploadUrl(String fileName, String contentType, String folder) {
        // 1. Kiểm tra định dạng và tệp tin an toàn (validate file type)
        validateFile(fileName, contentType);

        // 2. Tách phần mở rộng của file và sinh khóa duy nhất (UUID) để tránh ghi đè tệp trên cloud
        String extension = "";
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = fileName.substring(dotIndex);
        }
        String uniqueKey = folder + "/" + UUID.randomUUID() + extension;

        // 2. Tạo yêu cầu PutObjectRequest chỉ định kiểu file
        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(uniqueKey)
                .contentType(contentType)
                .build();

        // 3. Thiết lập yêu cầu ký với thời gian hết hạn là 5 phút
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(5))
                .putObjectRequest(putObjectRequest)
                .build();

        // 4. Thực hiện ký yêu cầu PUT
        PresignedPutObjectRequest presignedPutObjectRequest = s3Presigner.presignPutObject(presignRequest);

        // 5. Đường dẫn upload (PUT URL) cấp quyền upload file trực tiếp cho Client
        String uploadUrl = presignedPutObjectRequest.url().toString();

        // 6. Đường dẫn truy cập công khai (GET URL) sau khi upload thành công để lưu vào Database
        String cleanPublicUrl = publicUrl.endsWith("/") ? publicUrl : publicUrl + "/";
        String finalPublicUrl = cleanPublicUrl + uniqueKey;

        return PresignedUrlResponse.builder()
                .uploadUrl(uploadUrl)
                .publicUrl(finalPublicUrl)
                .build();
    }

    /**
     * Kiểm tra tính hợp lệ của tệp tin dựa trên phần mở rộng và kiểu định dạng (MIME Type).
     * Chỉ cho phép tải lên: Ảnh, Video, PDF, Word (doc/docx), Markdown (md), Txt.
     */
    private void validateFile(String fileName, String contentType) {
        if (fileName == null || contentType == null || fileName.trim().isEmpty() || contentType.trim().isEmpty()) {
            throw new BadRequestException("Tên tệp tin và kiểu định dạng (contentType) không được để trống");
        }

        String extension = "";
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = fileName.substring(dotIndex).toLowerCase();
        }

        // 1. Kiểm tra phần mở rộng tệp tin (File Extension)
        boolean isValidExtension = extension.equals(".jpg") || extension.equals(".jpeg") ||
                extension.equals(".png") || extension.equals(".gif") ||
                extension.equals(".webp") || extension.equals(".bmp") ||
                extension.equals(".tiff") || extension.equals(".mp4") ||
                extension.equals(".mov") || extension.equals(".avi") ||
                extension.equals(".webm") || extension.equals(".mkv") ||
                extension.equals(".pdf") || extension.equals(".doc") ||
                extension.equals(".docx") || extension.equals(".md") ||
                extension.equals(".txt");

        // 2. Kiểm tra Content-Type (MIME Type)
        String mime = contentType.toLowerCase();
        boolean isValidMime = mime.startsWith("image/") ||
                mime.startsWith("video/") ||
                mime.equals("application/pdf") ||
                mime.equals("application/msword") ||
                mime.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
                mime.equals("text/markdown") ||
                mime.equals("text/x-markdown") ||
                mime.equals("text/plain") ||
                mime.equals("application/octet-stream"); // Hỗ trợ tệp nhị phân thô

        if (!isValidExtension || !isValidMime) {
            throw new BadRequestException("Định dạng tệp không được hỗ trợ.");
        }
    }
}
