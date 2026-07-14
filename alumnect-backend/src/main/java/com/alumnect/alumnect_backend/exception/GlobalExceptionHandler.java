package com.alumnect.alumnect_backend.exception;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.HashMap;
import java.util.Map;

/**
 * Bộ xử lý ngoại lệ toàn cục (Global Exception Handler) cho toàn bộ các API Controller.
 * Chuyển đổi tất cả các exception phát sinh trong quá trình chạy thành API response chuẩn {@link ApiResponse}.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Xử lý ngoại lệ ResourceNotFoundException khi không tìm thấy tài nguyên trong DB.
     * Trả về HTTP Status 404 (Not Found).
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        return new ResponseEntity<>(
                ApiResponse.error(404, ex.getMessage()),
                HttpStatus.NOT_FOUND
        );
    }

    /**
     * Xử lý ngoại lệ GoogleUserNotFoundException khi người dùng Google chưa đăng ký tài khoản.
     * Trả về HTTP Status 404 (Not Found) kèm thông tin cơ bản để điền form đăng ký.
     */
    @ExceptionHandler(GoogleUserNotFoundException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleGoogleUserNotFoundException(GoogleUserNotFoundException ex) {
        Map<String, String> data = new HashMap<>();
        data.put("email", ex.getEmail());
        data.put("fullName", ex.getFullName());
        data.put("providerUserId", ex.getProviderUserId());

        return new ResponseEntity<>(
                ApiResponse.error(404, ex.getMessage(), data),
                HttpStatus.NOT_FOUND
        );
    }

    /**
     * Xử lý ngoại lệ ConflictException khi tài nguyên bị xung đột (VD: email bị trùng).
     * Trả về HTTP Status 409 (Conflict).
     */
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflictException(ConflictException ex) {
        return new ResponseEntity<>(
                ApiResponse.error(409, ex.getMessage()),
                HttpStatus.CONFLICT
        );
    }

    /**
     * Xử lý ngoại lệ BadRequestException khi dữ liệu truyền lên không hợp lệ.
     * Trả về HTTP Status 400 (Bad Request).
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequestException(BadRequestException ex) {
        return new ResponseEntity<>(
                ApiResponse.error(400, ex.getMessage()),
                HttpStatus.BAD_REQUEST
        );
    }

    /**
     * Xử lý ngoại lệ ForbiddenException khi người dùng không có quyền truy cập tài nguyên.
     * Trả về HTTP Status 403 (Forbidden) — VD: Guest xem chi tiết bài viết MEMBERS (BR-12, UC16).
     */
    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbiddenException(ForbiddenException ex) {
        return new ResponseEntity<>(
                ApiResponse.error(403, ex.getMessage()),
                HttpStatus.FORBIDDEN
        );
    }

    /**
     * Xử lý ngoại lệ MethodArgumentTypeMismatchException khi tham số đường dẫn/truy vấn sai kiểu
     * (VD: gọi GET /posts/abc trong khi {@code id} phải là số) → trả về HTTP 400 thay vì 500.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return new ResponseEntity<>(
                ApiResponse.error(400, "Tham số '" + ex.getName() + "' không hợp lệ"),
                HttpStatus.BAD_REQUEST
        );
    }

    /**
     * Xử lý ngoại lệ MethodArgumentNotValidException khi dữ liệu DTO vi phạm các ràng buộc validate (VD: @NotBlank, @Size).
     * Trả về HTTP Status 400 (Bad Request) kèm theo chi tiết các trường bị lỗi.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        return new ResponseEntity<>(
                ApiResponse.error(-1, "Dữ liệu gửi lên không hợp lệ", errors),
                HttpStatus.BAD_REQUEST
        );
    }

    /**
     * Xử lý tất cả các ngoại lệ còn lại chưa được bắt cụ thể khác.
     * Trả về HTTP Status 500 (Internal Server Error) để ẩn giấu thông tin nhạy cảm của hệ thống.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        log.error("Hệ thống xảy ra lỗi: ", ex);
        // Không nối ex.getMessage() vào response để tránh lộ chi tiết nội bộ ra client;
        // chi tiết đầy đủ đã được ghi vào log phía trên. Chuỗi này đồng thời là nội dung
        // chuẩn MSG-FEED-03 mà Frontend hiển thị nguyên văn khi tải bảng tin thất bại.
        return new ResponseEntity<>(
                ApiResponse.error(500, "Đã có lỗi hệ thống xảy ra. Vui lòng thử lại."),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}
