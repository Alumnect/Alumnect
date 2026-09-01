# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)

## 1. THÔNG TIN CHUNG (GENERAL INFO)
- **Tên tính năng:** Đăng lại bài viết (Repost a post)
- **Mã số Use Case / SRS ID:** UC21
- **Mức độ ưu tiên:** Medium
- **Người lập tài liệu:** System AI
- **Ngày lập:** 01/09/2026

## 2. YÊU CẦU CHỨC NĂNG VẮN TẮT (BRIEF REQUIREMENTS)
Cho phép người dùng đã đăng nhập (STUDENT, ALUMNI) chia sẻ hoặc đăng lại một bài viết có sẵn trên hệ thống lên Feed của mình để những người dùng khác có thể xem. Người dùng có thể thêm bình luận trích dẫn vào bài đăng lại. Tính năng đăng lại sử dụng thiết kế tự tham chiếu (self-reference) thông qua liên kết giữa bài đăng mới (với tư cách là bài repost) và bài đăng gốc.

## 3. ĐỐI TƯỢNG SỬ DỤNG (ACTORS)
- **Primary Actor:** Sinh viên (STUDENT), Cựu sinh viên (ALUMNI) (Người đã đăng nhập).
- **Secondary Actor:** Không có.
- **Lưu ý:** GUEST không được phép đăng lại bài viết, sẽ hiển thị modal yêu cầu đăng nhập. Quản trị viên (ADMIN) không có hồ sơ cộng đồng nên không tham gia chức năng này.

## 4. LUỒNG SỰ KIỆN (EVENT FLOWS)
### 4.1. Luồng cơ bản (Basic Flow)
1. Người dùng (STUDENT/ALUMNI) lướt Bảng tin (Feed) và nhìn thấy một bài viết thú vị (Status = ACTIVE).
2. Người dùng nhấn vào nút "Đăng lại" (Repost) ở góc dưới bài viết.
3. Hệ thống hiển thị Modal "Đăng lại bài viết".
4. (Tùy chọn) Người dùng nhập thêm nội dung/bình luận của riêng mình cho bài repost.
5. Người dùng nhấn nút "Đăng lại" (Submit).
6. Hệ thống kiểm tra tính hợp lệ của bài gốc (còn tồn tại, đang ACTIVE).
7. Nếu hợp lệ, hệ thống tạo một `Post` mới (category = GENERAL), có nội dung người dùng nhập, và `repostOf` trỏ về `originalPost`. Nếu người dùng repost một bài vốn đã là repost, `repostOf` sẽ được trỏ thẳng tới bài viết lõi (bài nguyên thủy nhất) nhằm tránh quan hệ lồng nhau quá sâu.
8. Tăng `repostCount` của bài gốc thêm 1.
9. Hệ thống đóng Modal và cập nhật Bảng tin ngay lập tức (hiển thị bài repost mới ở đầu).

### 4.2. Luồng ngoại lệ (Alternative/Exception Flows)
- **A1. GUEST chưa đăng nhập:** Nhấn "Đăng lại", hệ thống bật popup mời Đăng nhập. Không mở Modal Repost.
- **A2. Bài viết gốc không tồn tại / Đã bị ẩn/xóa:** Khi submit repost, API trả về 404/400. Hệ thống báo lỗi "Không thể đăng lại bài viết này".

## 5. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE DESIGN)
Dữ liệu Repost không sử dụng bảng riêng, mà tích hợp trực tiếp vào bảng `posts` bằng cơ chế tự tham chiếu.
- **Bảng:** `posts`
- **Các cột liên quan thêm mới/có sẵn:**
  - `repost_of_id` (BIGINT, Nullable): Foreign key trỏ về `id` của chính bảng `posts`. NULL nếu đây là bài viết gốc.
  - `repost_count` (INT, Default 0): Tổng số lượt đăng lại của bài viết gốc.
  - `status` (VARCHAR): Enum ['ACTIVE', 'HIDDEN', 'DELETED']. Chỉ cho phép repost bài ACTIVE.

**Index:**
Bảng `posts` đã được đánh index trên `repost_of_id` nhằm tối ưu truy vấn đếm số lượng repost hoặc hiển thị original post. (Migration `V6__add_post_reposts_indexes.sql`).

## 6. THIẾT KẾ API (API DESIGN)
**Endpoint:** `POST /api/v1/posts/{id}/repost`
- **Mô tả:** Đăng lại một bài viết có sẵn.
- **Header:** `Authorization: Bearer <token>`
- **Path Variables:**
  - `id`: ID của bài viết cần đăng lại.
- **Request Body (JSON):**
  ```json
  {
    "content": "Tuyệt vời quá! (Tùy chọn)"
  }
  ```
- **Response (201 Created):**
  Trả về đối tượng `PostResponse` đã chuẩn hóa (có đầy đủ `originalPost` lồng bên trong).

## 7. GIAO DIỆN NGƯỜI DÙNG (UI/UX PROTOTYPE)
- **PostCard:** Bổ sung nút "Đăng lại" (icon `Repeat2`). Hiển thị `post.reposts` (số lượt đăng lại). Nếu là bài repost (có `originalPost`), card bài viết sẽ render một khối container phụ nằm lồng bên trong chứa thông tin của bài gốc (tác giả, nội dung tóm tắt, thẻ tag tuyển dụng/sự kiện).
- **RepostModal:** Modal nổi (Z-index cao). Có avatar người dùng hiện tại, ô textarea để nhập nội dung (quote) và preview thông tin tóm tắt của bài gốc bên dưới. Nút "Đăng lại" đi kèm loading state khi API đang xử lý.
- **Tương tác:** Guest ấn vào nút Đăng lại sẽ mở modal login của hệ thống.

## 8. QUY TRÌNH KIỂM THỬ (TESTING PLAN)
- **TC1:** Đăng lại bài viết với tư cách STUDENT/ALUMNI thành công, có kèm nội dung trích dẫn. Kiểm tra UI Feed cập nhật tức thời (Optimistic Update/Invalidate query).
- **TC2:** Đăng lại một bài viết đã là bài repost. Kiểm tra DB xem `repost_of_id` có trỏ đúng vào bài gốc (depth = 1) thay vì bài repost (depth = 2) không.
- **TC3:** Guest nhấn Đăng lại => Pop up đăng nhập hiện ra.
- **TC4:** Người dùng nhập nội dung vượt quá giới hạn (nếu có validation) => Xử lý lỗi UI.
- **TC5:** Bảng tin hiển thị đúng số lượt `repostCount` sau khi có người dùng repost.
