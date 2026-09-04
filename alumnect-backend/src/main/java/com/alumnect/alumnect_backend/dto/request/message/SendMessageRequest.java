package com.alumnect.alumnect_backend.dto.request.message;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * DTO yêu cầu gửi tin nhắn mới (văn bản hoặc đính kèm đa phương tiện).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    /** Mã cuộc hội thoại (nếu đã có) */
    private Long conversationId;

    /** Mã người nhận (bắt buộc khi chưa có conversationId hoặc để xác thực gửi trực tiếp) */
    private Long recipientId;

    /** Nội dung văn bản tin nhắn */
    @Size(max = 5000, message = "Nội dung tin nhắn không vượt quá 5000 ký tự.")
    private String content;

    /** Danh sách các tệp đính kèm (hình ảnh, video, tài liệu) */
    @Valid
    private List<AttachmentRequest> attachments;
}
