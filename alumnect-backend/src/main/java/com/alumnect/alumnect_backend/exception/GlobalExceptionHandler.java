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
                new ApiResponse<>(-1, "Dữ liệu gửi lên không hợp lệ", errors),
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
        return new ResponseEntity<>(
                ApiResponse.error(500, "Lỗi hệ thống nội bộ: " + ex.getMessage()),
                HttpStatus.INTERNAL_SERVER_ERROR
        );
    }
}
