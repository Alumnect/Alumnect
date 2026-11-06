package com.alumnect.alumnect_backend.service.moderation;

/**
 * Kết quả kiểm duyệt hình ảnh nhị phân (Binary AI Image Moderation Result).
 * Chỉ xác định ảnh có vi phạm tiêu chuẩn cộng đồng (nhạy cảm 18+ / bạo lực máu me) hay không,
 * không chấm thang điểm nhiều mức như kiểm duyệt văn bản.
 *
 * @param violated        true nếu phát hiện ảnh nhạy cảm hoặc bạo lực cần tự động ẩn ngay
 * @param category        Nhóm phân loại: SAFE, SENSITIVE_NSFW, hoặc VIOLENCE_GORE
 * @param reason          Giải thích ngắn gọn bằng tiếng Việt từ AI (khi vi phạm)
 * @param flaggedImageKey Định danh ngắn của tệp ảnh vi phạm để tránh ẩn lặp nếu Admin đã duyệt bỏ qua
 */
public record ImageModerationResult(
        boolean violated,
        String category,
        String reason,
        String flaggedImageKey
) {
    public static final String CATEGORY_SAFE = "SAFE";
    public static final String CATEGORY_SENSITIVE_NSFW = "SENSITIVE_NSFW";
    public static final String CATEGORY_VIOLENCE_GORE = "VIOLENCE_GORE";

    /** Kết quả mặc định khi ảnh an toàn hoặc bỏ qua kiểm tra. */
    public static ImageModerationResult safe() {
        return new ImageModerationResult(false, CATEGORY_SAFE, null, null);
    }
}

