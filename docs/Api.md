# ĐẶC TẢ GIAO DIỆN API (RESTFUL API SPECIFICATION)

Tài liệu này định nghĩa cấu trúc dữ liệu truyền tải (DTO), định dạng phản hồi chuẩn (Standard API Response) và danh sách các endpoints chính trong dự án **AlumNect**.

---

## 1. ĐỊNH DẠNG PHẢN HỒI CHUẨN (STANDARD RESPONSE FORMAT)

Tất cả các API Endpoints trong dự án đều trả về dữ liệu được đóng gói theo cấu trúc thống nhất dưới đây:

### 1.1. Phản Hồi Thành Công (Success Response)
*   **HTTP Status**: `200 OK`, `201 Created`
*   **Cấu trúc JSON**:
    ```json
    {
      "status": 200,
      "message": "Thông báo thành công",
      "data": { ... } // Đối tượng hoặc danh sách kết quả trả về
    }
    ```

### 1.2. Phản Hồi Lỗi (Error Response)
*   **HTTP Status**: `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`
*   **Cấu trúc JSON**:
    ```json
    {
      "status": 400,
      "error": "Tên lỗi ngắn gọn",
      "message": "Chi tiết nguyên nhân gây lỗi bằng tiếng Việt",
      "details": { ... } // Chứa chi tiết lỗi validation từng trường (nếu có)
    }
    ```

---

## 2. DANH SÁCH ENDPOINTS CHÍNH (PRINCIPAL API ENDPOINTS)

### 2.1. Module 1: Authentication & Account (Xác thực & Tài khoản)

| Phương thức | Endpoint | Phân quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Guest | Đăng ký tài khoản mới (Student hoặc Alumni) |
| **POST** | `/api/auth/login` | Guest | Đăng nhập bằng Email và Password, trả về JWT Token |
| **POST** | `/api/auth/google` | Guest | Đăng nhập nhanh qua Google OAuth 2.0 |
| **POST** | `/api/auth/forgot-password`| Guest | Yêu cầu gửi link đặt lại mật khẩu qua Email |
| **POST** | `/api/auth/reset-password` | Guest | Đặt lại mật khẩu mới bằng token trong mail |
| **POST** | `/api/auth/change-password`| Student, Alumni, Admin | Đổi mật khẩu mới khi đang đăng nhập |
| **POST** | `/api/auth/logout` | Student, Alumni, Admin | Đăng xuất tài khoản, thu hồi token JWT |
| **POST** | `/api/auth/verify-alumni` | Student (đang chờ) | Gửi bằng chứng FPTU để xin duyệt làm Alumni |

---

### 2.2. Module 2: Profile (Hồ sơ cá nhân)

| Phương thức | Endpoint | Phân quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/profiles/me` | Student, Alumni | Lấy thông tin chi tiết hồ sơ cá nhân của tôi |
| **PUT** | `/api/profiles/me` | Student, Alumni | Cập nhật thông tin cơ bản, avatar, tiểu sử của tôi |
| **GET** | `/api/profiles/{id}` | Guest, Student, Alumni | Xem hồ sơ công khai của một thành viên khác |
| **GET** | `/api/profiles/search` | Guest, Student, Alumni | Tìm kiếm thành viên theo Tên, Khóa, Ngành, Kỹ năng |
| **GET** | `/api/profiles/suggestions`| Student, Alumni | Lấy gợi ý kết nối (cùng ngành học hoặc khóa học) |
| **POST**| `/api/profiles/follow/{id}`| Student, Alumni | Theo dõi (Follow) hoặc hủy theo dõi một thành viên |
| **GET** | `/api/notifications` | Student, Alumni | Lấy danh sách thông báo hệ thống |

---

### 2.3. Module 3: Social Feed, Posts & Recruitment (Bản tin, Bài viết & Tuyển dụng)

| Phương thức | Endpoint | Phân quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/posts` | Guest, Student, Alumni | Lấy bản tin cộng đồng (phân trang, lọc theo loại bài viết) |
| **POST** | `/api/posts` | Student, Alumni | Tạo bài viết mới (bài đăng thường, thành tựu, sự kiện...) |
| **GET** | `/api/posts/{id}` | Guest, Student, Alumni | Xem chi tiết bài viết và danh sách bình luận |
| **PUT** | `/api/posts/{id}` | Student, Alumni | Chỉnh sửa nội dung bài viết do chính mình đăng |
| **DELETE**| `/api/posts/{id}` | Student, Alumni | Xóa bài viết của mình |
| **POST** | `/api/posts/{id}/like` | Student, Alumni | Thích hoặc hủy thích một bài viết |
| **POST** | `/api/posts/{id}/comments`| Student, Alumni | Thêm bình luận mới dưới bài viết |
| **DELETE**| `/api/comments/{id}` | Student, Alumni | Xóa bình luận của mình |
| **POST** | `/api/jobs` | Alumni | Tạo tin tuyển dụng (đòi hỏi gói active quota còn hạn) |
| **GET** | `/api/jobs` | Guest, Student, Alumni | Lấy danh sách tin tuyển dụng trên bảng tin việc làm |
| **POST** | `/api/packages/buy` | Alumni | Chọn gói đăng tuyển dụng và lấy link PayOS thanh toán |
| **POST** | `/api/payment/webhook` | Hệ thống PayOS | Nhận thông báo trạng thái thanh toán từ PayOS |

---

### 2.4. Module 4: Q&A Forum & Salary Board (Diễn đàn hỏi đáp & Khảo sát lương)

| Phương thức | Endpoint | Phân quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/forum/questions` | Guest, Student, Alumni | Lấy danh sách câu hỏi diễn đàn (phân trang, lọc theo topic) |
| **POST** | `/api/forum/questions` | Student, Alumni | Đăng câu hỏi mới lên diễn đàn |
| **POST** | `/api/forum/questions/{id}/answers`| Student, Alumni | Trả lời cho một câu hỏi trên diễn đàn |
| **POST** | `/api/forum/votes` | Student, Alumni | Vote (+1 hoặc -1) cho câu hỏi hoặc câu trả lời |
| **POST** | `/api/salary/contribute`| Alumni | Đóng góp khảo sát lương ẩn danh của bản thân |
| **GET** | `/api/salary/statistics`| Student, Alumni | Lấy thống kê tổng hợp lương (nếu đã đủ lượng khảo sát tối thiểu) |

---

### 2.5. Module 5: Direct Messages & Map (Tin nhắn & Bản đồ cựu sinh viên)

| Phương thức | Endpoint | Phân quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/messages/conversations`| Student, Alumni | Lấy danh sách các cuộc trò chuyện hiện có (inbox) |
| **GET** | `/api/messages/conversations/{id}`| Student, Alumni | Lấy chi tiết tin nhắn trong cuộc trò chuyện |
| **POST** | `/api/messages` | Student, Alumni | Gửi tin nhắn mới |
| **GET** | `/api/map/alumni` | Guest, Student, Alumni | Lấy tọa độ địa lý các marker của cựu sinh viên |

---

### 2.6. Module 6: Admin Dashboard & System Management (Quản trị hệ thống)

| Phương thức | Endpoint | Phân quyền | Mô tả |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/admin/kpis` | Admin | Lấy chỉ số thống kê hệ thống (Người dùng mới, doanh thu...) |
| **GET** | `/api/admin/users` | Admin | Lấy danh sách tài khoản toàn hệ thống |
| **PUT** | `/api/admin/users/{id}/lock`| Admin | Khóa hoặc mở khóa tài khoản của người dùng |
| **POST** | `/api/admin/verifications/{id}/resolve`| Admin | Phê duyệt hoặc từ chối yêu cầu xác minh cựu sinh viên |
| **GET** | `/api/admin/reports` | Admin | Danh sách bài viết bị báo cáo vi phạm |
| **POST** | `/api/admin/reports/{id}/resolve`| Admin | Xử lý báo cáo (ẩn nội dung hoặc bỏ qua) |
| **POST** | `/api/admin/broadcast` | Admin | Phát thông báo broadcast toàn bộ hoặc theo nhóm người dùng |
