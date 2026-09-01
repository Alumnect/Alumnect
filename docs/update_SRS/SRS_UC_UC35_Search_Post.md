# TÀI LIỆU ĐẶC TẢ YÊU CẦU (SRS) - UC35

**Dự án:** Alumnect
**Mã Use Case:** UC35
**Tên Use Case:** Tìm kiếm bài viết trên Feed (Search Post)
**Ngày cập nhật:** 01/09/2026
**Trạng thái:** Chấp thuận (Approved)

---

## 1. MÔ TẢ TỔNG QUAN (DESCRIPTION)
Use case UC35 cho phép người dùng (bao gồm Guest, Sinh viên, Cựu sinh viên và Admin) tìm kiếm các bài viết đang ở trạng thái hiển thị (ACTIVE) trên bảng tin (Feed) thông qua từ khóa. Người dùng có thể tìm kiếm dựa trên nội dung bài viết (`content`) hoặc tên tác giả (`UserProfile.fullName`). Hỗ trợ kết hợp bộ lọc (Category) và phân trang.

## 2. ACTOR (NGƯỜI TƯƠNG TÁC)
- **Guest (Khách chưa đăng nhập):** Có thể tìm kiếm bài viết công khai.
- **Thành viên (Sinh viên / Cựu sinh viên):** Có thể tìm kiếm toàn bộ bài viết chưa bị ẩn hoặc xóa.
- **Quản trị viên (Admin):** Có thể tìm kiếm tương tự thành viên.

## 3. ĐIỀU KIỆN TIỀN QUYẾT (PRE-CONDITIONS)
- Hệ thống đã hiển thị màn hình trang chủ (Feed Page).
- Kết nối tới Backend bình thường.

## 4. LUỒNG SỰ KIỆN CHÍNH (MAIN FLOW)
1. Người dùng nhập từ khóa tìm kiếm vào thanh Search Bar trên giao diện Feed.
2. Quá trình nhập kết thúc sau 400ms (cơ chế Debounce) để chống spam API.
3. Frontend gửi request `GET /posts?keyword={từ khóa}&page=0&size=5` (và kèm tham số `type` nếu có lọc theo loại).
4. Backend nhận request:
   a. Chuẩn hóa (trim) chuỗi từ khóa, nếu chỉ có khoảng trắng thì coi như không có từ khóa.
   b. Dựa trên tham số phân trang và lọc, thực hiện truy vấn các bài viết ở trạng thái `ACTIVE` mà nội dung (content) hoặc tên tác giả (fullName) chứa từ khóa (không phân biệt hoa thường).
5. Backend trả dữ liệu bài viết (nếu có) dưới định dạng phân trang (Pagination).
6. Frontend nhận dữ liệu và hiển thị danh sách bài viết.

## 5. LUỒNG NGOẠI LỆ / LUỒNG PHỤ (ALTERNATIVE FLOWS)
**AF1: Không có kết quả nào khớp với từ khóa**
1. Ở bước 4 của Main Flow, Backend thực thi xong truy vấn nhưng không có bài viết nào phù hợp.
2. Backend trả về `PageResponse` với thuộc tính `content` rỗng và `totalElements = 0`.
3. Frontend hiển thị trạng thái Empty State "Không tìm thấy kết quả nào khớp với từ khóa".

**AF2: Từ khóa tìm kiếm hoàn toàn là khoảng trắng**
1. Ở bước 4a, Backend loại bỏ khoảng trắng dư thừa, từ khóa biến thành `null`.
2. Backend bỏ qua điều kiện `LIKE` và tải bảng tin Feed mặc định.

## 6. QUY TẮC NGHIỆP VỤ (BUSINESS RULES)
- **BR-35.1:** Tính năng tìm kiếm không phân biệt chữ hoa, chữ thường (Case Insensitive).
- **BR-35.2:** Tính năng tìm kiếm chỉ truy xuất những bài viết mang trạng thái `ACTIVE` (không truy xuất các bài HIDDEN hoặc DELETED).
- **BR-35.3:** Truy vấn kết hợp với tiêu chí lọc thể loại bài viết (`ACHIEVEMENT`, `EVENT`, `RECRUITMENT`, `GENERAL`) tạo thành giao của 2 tập hợp (AND).
- **BR-35.4:** Việc đánh dấu Highlight từ khóa trên giao diện không được thực hiện trong phiên bản này.

## 7. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)
- **Performance:** Frontend bắt buộc sử dụng Debounce (tối thiểu 300ms, hiện tại là 400ms) để không dội request quá nhiều xuống Server.
- **UI/UX:** Giao diện thanh tìm kiếm tuân thủ ngôn ngữ thiết kế chung của hệ thống (bo góc tròn, icon kính lúp mờ, viền đổi màu khi focus).

---
*(Tài liệu được tạo và biên soạn bởi AI)*
