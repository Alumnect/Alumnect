# KẾT QUẢ ĐÁNH GIÁ CHÉO (CROSS-CHECK) – MÃ NGUỒN VÀ TÀI LIỆU ĐẶC TẢ

**Tên tính năng:** Tìm kiếm bài viết  
**Mã Use Case:** UC35  
**Ngày thực hiện:** 01/09/2026  
**Người thực hiện:** Hệ thống AI (Antigravity)  

---

## 1. TỔNG QUAN TÍNH NHẤT QUÁN
- **Mức độ khớp (Match Rate):** 100%
- **Kết luận:** Mã nguồn hiện tại hoàn toàn khớp với đặc tả yêu cầu trong tài liệu.

## 2. CHI TIẾT KIỂM TRA CHÉO

### 2.1 Yêu Cầu Chức Năng (Functional Requirements)
- **Cho phép tìm kiếm bài viết bằng từ khóa:** Frontend thực hiện gọi API `GET /posts?keyword=...` kèm kỹ thuật debounce (400ms).
- **Bộ lọc loại bài viết (Category):** Giao diện vẫn cho phép chọn các tab: Tất cả, Thành tựu, Tuyển dụng, Sự kiện (tham số `type=...`).
- **Trạng thái ACTIVE:** Backend giới hạn điều kiện tìm kiếm bằng cách thêm cấu trúc điều kiện `WHERE p.status = com.alumnect.alumnect_backend.common.enums.PostStatus.ACTIVE`.
- **Nội dung và tác giả:** Backend sử dụng Spring Data JPA `@Query` thực hiện tìm kiếm từ khóa trên trường nội dung của bài viết (`p.content`) và tên tác giả (`up.fullName`) sử dụng toán tử `LOWER(...) LIKE LOWER(...)`.
- **Trạng thái trống:** Hiển thị giao diện báo rỗng chuyên biệt khi quá trình tìm kiếm không khớp bất kỳ kết quả nào.

### 2.2 Luồng API
- **Endpoint:** `GET /posts`
- **Request Parameters:**
  - `page`: (integer) (Mặc định: 0)
  - `size`: (integer) (Mặc định: 5)
  - `keyword`: (string) (Mới thêm)
  - `type`: (string) (Tùy chọn lọc loại bài)
- **Controller:** `PostController` nhận trực tiếp `keyword`, truyền xuống `PostService` chuẩn hóa chuỗi và cuối cùng tới `PostRepository`.

### 2.3 Phân Quyền Trực Tiếp
- **Guest:** Tìm kiếm và xem thông tin không cần đăng nhập.
- **Thành Viên:** Tương tự Guest, hỗ trợ lấy thông tin `liked`, `saved` cho mỗi bài viết để hiển thị chi tiết phù hợp trên Feed.

## 3. CÁC ĐIỂM CHÚ Ý HOẶC KIẾN NGHỊ (NẾU CÓ)
1. **Hiệu năng tìm kiếm:** Tại giai đoạn này, việc sử dụng toán tử LIKE là đủ do dữ liệu chưa lớn.
2. **Khoảng trắng:** Backend đã thêm logic dọn dẹp khoảng trắng dư thừa (`keyword.trim()`) và xử lý giá trị không hợp lệ. Khớp hoàn toàn với tiêu chuẩn.
3. **Index:** Việc không thêm Migration `V6` là đúng đắn vì Secondary Indexes trong Hibernate cần dựa trên yêu cầu từ B-Tree (không tối ưu với Full Text `%...%`).

---
*(Tài liệu này được sinh tự động thông qua quá trình đối chiếu giữa source code thực tế và kịch bản SRS).*
