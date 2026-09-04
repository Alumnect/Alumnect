package com.alumnect.alumnect_backend.common.constant;

/**
 * Định nghĩa các hằng số kênh (destinations, endpoints, brokers) của hệ thống WebSocket STOMP
 * dùng chung cho toàn bộ ứng dụng AlumNect (Nhắn tin, Thông báo, Real-time feeds).
 */
public final class WebSocketDestinations {

    private WebSocketDestinations() {
        // Private constructor to prevent instantiation
    }

    // ==========================================
    // CẤU HÌNH BROKER VÀ ENDPOINTS
    // ==========================================
    /** Endpoint chính để client bắt tay (handshake) kết nối WebSocket */
    public static final String WS_ENDPOINT = "/ws";

    /** Tiền tố cho các kênh tin nhắn gửi từ Client lên Server */
    public static final String APP_PREFIX = "/app";

    /** Tiền tố phân tuyến người dùng cho tin nhắn riêng tư */
    public static final String USER_PREFIX = "/user";

    /** Broker cho các kênh thông báo công khai / broadcast */
    public static final String TOPIC_PREFIX = "/topic";

    /** Broker cho các kênh cá nhân của từng người dùng */
    public static final String QUEUE_PREFIX = "/queue";

    // ==========================================
    // CÁC KÊNH RIÊNG TƯ (USER QUEUES - DÙNG CHO CONVERT_AND_SEND_TO_USER)
    // Client subscribe theo dạng: /user/queue/...
    // Khi gọi convertAndSendToUser, tham số destination là: /queue/...
    // ==========================================
    /** Kênh nhận tin nhắn trò chuyện trực tiếp 1-1 */
    public static final String USER_QUEUE_MESSAGES = "/queue/messages";

    /** Kênh nhận thông báo đẩy hệ thống (tương tác, follow, bài viết...) */
    public static final String USER_QUEUE_NOTIFICATIONS = "/queue/notifications";

    // ==========================================
    // CÁC KÊNH CÔNG KHAI (TOPICS - BROADCAST)
    // ==========================================
    /** Kênh phát sóng cập nhật bảng tin cộng đồng real-time */
    public static final String TOPIC_COMMUNITY_FEED = "/topic/feed";

    /** Kênh cập nhật trạng thái hoạt động người dùng */
    public static final String TOPIC_ONLINE_STATUS = "/topic/online-users";
}
