package com.alumnect.alumnect_backend.controller.file;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.response.storage.PresignedUrlResponse;
import com.alumnect.alumnect_backend.service.storage.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xử lý các yêu cầu liên quan đến tệp tin (upload/download).
 * Được map tự động với prefix global /api/v1/files.
 */
@RestController
@RequestMapping("/files")
public class FileController {

    @Autowired
    private StorageService storageService;

    /**
     * API sinh link ký sẵn (Presigned URL) cho phép khách hàng tự upload file trực tiếp lên Cloudflare R2.
     *
     * @param fileName Tên file gốc của người dùng gửi lên
     * @param contentType Kiểu MIME của tệp tin (VD: image/png, application/pdf...)
     * @return Response chứa link upload tạm thời và link công khai bọc trong {@link ApiResponse}
     */
    @GetMapping("/presigned-url")
    public ResponseEntity<ApiResponse<PresignedUrlResponse>> getPresignedUrl(
            @RequestParam("fileName") String fileName,
            @RequestParam("contentType") String contentType,
            @RequestParam(value = "folder", defaultValue = "common") String folder) {

        PresignedUrlResponse response = storageService.generatePresignedUploadUrl(fileName, contentType, folder);
        return ResponseEntity.ok(ApiResponse.success("Sinh link ký sẵn thành công", response));
    }
}
