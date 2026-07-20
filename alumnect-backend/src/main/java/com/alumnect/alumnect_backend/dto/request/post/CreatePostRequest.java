package com.alumnect.alumnect_backend.dto.request.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa dữ liệu yêu cầu tạo một bài viết mới trên bảng tin cộng đồng
 * (UC14 - Create a post on the Feed).
 * <p>
 * {@code type} và {@code visibility} nhận dưới dạng chuỗi (Frontend gửi chữ thường)
 * và được chuẩn hóa/kiểm tra hợp lệ ở tầng Service (mặc định NORMAL / PUBLIC nếu để trống),
 * đồng nhất với cách xử lý ở luồng xem bảng tin (UC15).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePostRequest {

    /** Nội dung văn bản của bài viết (bắt buộc, tối đa 5000 ký tự) */
    @NotBlank(message = "Nội dung bài viết không được để trống")
    @Size(max = 5000, message = "Nội dung bài viết không được vượt quá 5000 ký tự")
    private String content;

    /**
     * Loại bài viết: "normal" | "achievement" | "recruitment" | "event".
     * Bỏ trống sẽ mặc định là NORMAL. Giá trị không hợp lệ trả về lỗi 400 ở tầng Service.
     */
    private String type;

    /** URL ảnh đính kèm (tùy chọn, tối đa 500 ký tự), null/rỗng nếu bài viết không có ảnh */
    @Size(max = 500, message = "URL ảnh không được vượt quá 500 ký tự")
    private String imageUrl;

    /**
     * Phạm vi hiển thị: "public" (mọi người kể cả Guest) | "members" (chỉ thành viên đã đăng nhập).
     * Bỏ trống sẽ mặc định là PUBLIC. Giá trị không hợp lệ trả về lỗi 400 ở tầng Service.
     */
    private String visibility;
}
