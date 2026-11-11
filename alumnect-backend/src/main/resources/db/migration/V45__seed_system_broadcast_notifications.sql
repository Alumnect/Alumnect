-- Migration V45: Seed sample system broadcast notifications
-- Created for Admin System Notification Management

INSERT INTO system_notifications (
    title,
    content,
    recipient_type,
    recipient_role,
    recipient_user_id,
    status,
    duration_type,
    scheduled_at,
    sent_at,
    expires_at,
    created_by,
    created_at,
    updated_at,
    archived_at
) VALUES
-- 1. Đang hoạt động: Gửi toàn hệ thống, hiệu lực 1 tuần (tạo hôm nay)
(
    'Bảo trì nâng cấp hạ tầng định kỳ cụm máy chủ AlumNect 2.5',
    'Hệ thống mạng lưới AlumNect sẽ tiến hành bảo trì nâng cấp đường truyền và thuật toán gợi ý Mentor vào lúc 02:00 đến 04:00 sáng Chủ Nhật tuần này. Trong khoảng thời gian này, các tính năng nhắn tin và thanh toán có thể bị gián đoạn tạm thời. Quý thầy cô, Cựu sinh viên và các bạn Sinh viên vui lòng chủ động kế hoạch học tập & kết nối.',
    'ALL_USERS',
    NULL,
    NULL,
    'ACTIVE',
    'ONE_WEEK',
    NULL,
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '7 days',
    3,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours',
    NULL
),

-- 2. Đang hoạt động: Dành riêng cho Sinh viên (STUDENT), hiệu lực 1 tháng
(
    'Khởi động Chiến dịch Mentoring Mùa Xuân 2026: Kết nối Cố vấn 1-1',
    'Chương trình Cố vấn nghề nghiệp 1-1 chính thức mở cổng đăng ký đợt 1 năm 2026. Sinh viên có thể tìm kiếm, gửi yêu cầu kết nối và nhận lời khuyên chuyên môn từ hơn 500+ Cựu sinh viên tiêu biểu đang công tác tại Google, FPT Software, Microsoft, Shopee. Hãy cập nhật CV và hồ sơ cá nhân để nhận tư vấn sớm nhất!',
    'USER_ROLE',
    'STUDENT',
    NULL,
    'ACTIVE',
    'ONE_MONTH',
    NULL,
    NOW() - INTERVAL '4 hours',
    NOW() + INTERVAL '30 days',
    3,
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '4 hours',
    NULL
),

-- 3. Đang hẹn giờ: Gửi toàn hệ thống vào 2 ngày tới (SCHEDULED)
(
    'Thông báo phát hành tính năng: Cổng Xác thực Bằng cấp Số Alumnect ID',
    'Từ tuần tới, AlumNect chính thức tích hợp giải pháp xác thực văn bằng điện tử dành cho toàn bộ Cựu sinh viên FPTU. Cựu sinh viên có thể yêu cầu cấp mã định danh số để bổ sung vào hồ sơ LinkedIn và CV ứng tuyển quốc tế. Quản trị viên sẽ tiến hành phê duyệt tự động qua cổng dữ liệu đào tạo.',
    'ALL_USERS',
    NULL,
    NULL,
    'SCHEDULED',
    'ONE_MONTH',
    NOW() + INTERVAL '2 days',
    NULL,
    NULL,
    3,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour',
    NULL
),

-- 4. Đang hẹn giờ: Dành riêng cho Cựu sinh viên (ALUMNI) vào ngày mai (SCHEDULED)
(
    'Thư mời tham dự Dạ tiệc Kết nối Cố vấn Doanh nghiệp FPT Alumni Gala 2026',
    'Trân trọng kính mời Quý Cố vấn và Anh/Chị Cựu sinh viên tham dự đêm Gala Tri ân & Mạng lưới Cố vấn Doanh nghiệp. Sự kiện quy tụ các thế hệ cựu sinh viên thành đạt nhằm chia sẻ kinh nghiệm khởi nghiệp, mở rộng cơ hội tuyển dụng và tôn vinh những đóng góp xuất sắc trong phong trào Mentoring trường Đại học FPT.',
    'USER_ROLE',
    'ALUMNI',
    NULL,
    'SCHEDULED',
    'ONE_WEEK',
    NOW() + INTERVAL '1 day',
    NULL,
    NULL,
    3,
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '30 minutes',
    NULL
),

-- 5. Đang hoạt động: Gửi cho cá nhân cụ thể (user id 1: FierZone)
(
    'Nhắc nhở hoàn thiện xác thực hồ sơ tốt nghiệp đại học FPT',
    'Hệ thống nhận thấy bạn đã gửi yêu cầu xác thực cựu sinh viên nhưng còn thiếu ảnh chụp minh chứng mặt sau của Bằng tốt nghiệp. Vui lòng truy cập trang Cài đặt tài khoản > Xác thực cựu sinh viên để tải lại ảnh rõ nét hơn, giúp ban quản trị phê duyệt hồ sơ trong vòng 24 giờ làm việc.',
    'SPECIFIC_USER',
    NULL,
    1,
    'ACTIVE',
    'ONE_WEEK',
    NULL,
    NOW() - INTERVAL '5 hours',
    NOW() + INTERVAL '7 days',
    3,
    NOW() - INTERVAL '5 hours',
    NOW() - INTERVAL '5 hours',
    NULL
),

-- 6. Đã hết hạn (EXPIRED): Tạo từ tuần trước, hết hạn hôm qua
(
    'Khảo sát nhu cầu tuyển dụng thực tập sinh Kỳ Fall 2025',
    'Phòng Quan hệ Doanh nghiệp kính gửi phiếu khảo sát nhu cầu tiếp nhận sinh viên thực tập đến các doanh nghiệp do Cựu sinh viên điều hành hoặc phụ trách tuyển dụng. Thời hạn hoàn thành khảo sát đã kết thúc. Cảm ơn Quý Doanh nghiệp và Cựu sinh viên đã đồng hành cùng thế hệ trẻ FPTU.',
    'USER_ROLE',
    'ALUMNI',
    NULL,
    'EXPIRED',
    'ONE_WEEK',
    NULL,
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '1 day',
    3,
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '1 day',
    NULL
),

-- 7. Kho lưu trữ (ARCHIVED): Thông báo chúc mừng năm mới đã lưu trữ
(
    'Thư chúc mừng Năm Mới 2026 từ Ban Giám Hiệu và Mạng lưới Cựu Sinh Viên',
    'Nhân dịp đón chào năm mới 2026, Ban Giám hiệu Trường Đại học FPT và Mạng lưới AlumNect xin gửi tới toàn thể Quý Cựu sinh viên, Quý Doanh nghiệp đối tác và các bạn Sinh viên lời chúc mừng năm mới An Khang Thịnh Vượng, Vạn Sự Như Ý. Chúc cộng đồng AlumNect ngày càng vững mạnh và vươn xa trên trường quốc tế!',
    'ALL_USERS',
    NULL,
    NULL,
    'ARCHIVED',
    'ONE_MONTH',
    NULL,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '15 days',
    3,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),

-- 8. Đã hủy lịch (CANCELLED): Thông báo thử nghiệm được Admin hủy bỏ
(
    'Thông báo diễn tập an ninh mạng nội bộ định kỳ tháng 11',
    'Kế hoạch diễn tập phòng chống tấn công lừa đảo trực tuyến (Phishing simulation) dự kiến tổ chức vào cuối tuần này đã được hoãn lại để phối hợp với Trung tâm Dịch vụ CNTT toàn trường. Thời gian mới sẽ được thông báo sau.',
    'ALL_USERS',
    NULL,
    NULL,
    'CANCELLED',
    'ONE_DAY',
    NOW() - INTERVAL '1 day',
    NULL,
    NULL,
    3,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '1 day',
    NULL
);

