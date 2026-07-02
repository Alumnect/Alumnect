package com.alumnect.alumnect_backend.common.api;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lớp bọc kết quả phản hồi (Response Wrapper) thống nhất cho toàn hệ thống API.
 * 
 * @param <T> Kiểu dữ liệu trả về ở phần field data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    /** Mã lỗi: 0 nghĩa là thành công, khác 0 (thường là -1 hoặc mã HTTP) nghĩa là có lỗi xảy ra */
    private Integer error;

    /** Thông điệp thông báo trạng thái phản hồi */
    private String message;

    /** Dữ liệu phản hồi thực tế (có thể là đối tượng đơn, danh sách hoặc null) */
    private T data;

    /**
     * Tạo response thành công chỉ chứa data, với thông báo mặc định là "Thành công".
     */
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(0, "Thành công", data);
    }

    /**
     * Tạo response thành công chứa thông báo tùy chỉnh và data.
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(0, message, data);
    }

    /**
     * Tạo response lỗi với mã lỗi mặc định là -1 và thông báo tùy chỉnh.
     */
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(-1, message, null);
    }

    /**
     * Tạo response lỗi với mã lỗi tùy chỉnh và thông báo tùy chỉnh.
     */
    public static <T> ApiResponse<T> error(int code, String message) {
        return new ApiResponse<>(code, message, null);
    }
}
