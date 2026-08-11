package com.alumnect.alumnect_backend.dto.request.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa dữ liệu yêu cầu chỉnh sửa một bài viết trên bảng tin cộng đồng
 * (UC22 - Edit a post).
 * <p>
 * Cấu trúc trường giống {@link CreatePostRequest}: nội dung bắt buộc, loại và phạm vi
 * hiển thị mặc định NORMAL/PUBLIC nếu để trống, ảnh đính kèm tùy chọn.
 * Tầng Service sẽ kiểm tra thêm quyền sở hữu (chỉ tác giả mới được sửa bài của mình).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EditPostRequest {

    /** Nội dung văn bản của bài viết sau khi chỉnh sửa (bắt buộc, tối đa 5000 ký tự) */
    @NotBlank(message = "Nội dung bài viết không được để trống")
    @Size(max = 5000, message = "Nội dung bài viết không được vượt quá 5000 ký tự")
    private String content;

    /**
     * Loại bài viết: "normal" | "achievement" | "recruitment" | "event".
     * Bỏ trống sẽ giữ nguyên loại hiện tại. Giá trị không hợp lệ trả về lỗi 400 ở tầng Service.
     */
    private String type;

    /** URL ảnh đính kèm (tùy chọn, tối đa 500 ký tự). Gửi chuỗi rỗng hoặc null để xóa ảnh cũ */
    @Size(max = 500, message = "URL ảnh không được vượt quá 500 ký tự")
    private String imageUrl;

    /**
     * Phạm vi hiển thị: "public" (mọi người kể cả Guest) | "members" (chỉ thành viên đã đăng nhập).
     * Bỏ trống sẽ giữ nguyên phạm vi hiện tại. Giá trị không hợp lệ trả về lỗi 400 ở tầng Service.
     */
    private String visibility;
}
