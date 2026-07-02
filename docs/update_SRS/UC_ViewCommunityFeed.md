# UC15 - Xem Bảng Tin Cộng Đồng (View community Feed)

> Tài liệu đặc tả Use Case cho tính năng phía Frontend (FE). Thuộc Module 3 -
> Social: Feed, Posts, Events, Packages & Messaging. Owner: Nguyễn Hữu Triết.
> Sprint: ACCP Sprint 01. MoSCoW: **M** — Product priority: **P0**.

---

## 1. Thông tin chung

| Mục | Nội dung |
| :--- | :--- |
| **Mã Use Case** | UC15 |
| **Tên Use Case** | Xem bảng tin cộng đồng (View community Feed) |
| **Module** | Module 3 — Social Feed, Posts & Recruitment |
| **Tác nhân (Actors)** | Guest (khách), Student (sinh viên), Alumni (cựu sinh viên) |
| **Đường dẫn** | `/app` (trang chủ khu vực đã đăng nhập, đồng thời là bảng tin) |
| **API liên quan** | `GET /api/posts?page={n}&size={m}&sort=recent[&type=...]` |

---

## 2. Mô tả ngắn

Hiển thị dòng bài viết của cộng đồng cựu sinh viên theo thứ tự mới nhất, cho
phép người dùng theo dõi hoạt động cộng đồng. Guest chỉ xem được các bài viết
công khai (PUBLIC) và ở chế độ **chỉ đọc**; Student/Alumni có thể đăng bài và
tương tác (thích, bình luận, đăng lại, báo cáo).

---

## 3. Điều kiện tiên quyết (Preconditions)

1. Ứng dụng Frontend đã được tải và định tuyến tới `/app`.
2. Backend cung cấp endpoint `GET /api/posts` (ở chế độ demo `VITE_REQUIRE_AUTH=false`
   thì Frontend dùng dữ liệu mock để hoạt động độc lập).
3. Nếu người dùng đã đăng nhập, `accessToken` hợp lệ được lưu trong `authStore`
   và tự động đính kèm vào header `Authorization: Bearer <token>`.

## 4. Điều kiện sau khi thực hiện (Postconditions)

1. Danh sách bài viết của trang hiện tại được hiển thị theo thứ tự mới nhất.
2. Với người dùng đã đăng nhập, mỗi bài viết phản ánh đúng cờ `liked` của họ.
3. Trạng thái cache của TanStack Query (`queryKey: ['feed', filter]`) được cập nhật
   để phục vụ các lần xem lại mà không cần gọi lại API ngay.

---

## 5. Luồng sự kiện chính (Main Flow)

1. Người dùng mở trang `/app`.
2. Hệ thống gọi `useFeed(filter)` → phát yêu cầu `GET /api/posts?page=0&size=5&sort=recent`.
3. Trong lúc chờ, giao diện hiển thị **khung xương (skeleton)** loading.
4. Backend trả về một trang bài viết công khai (với Guest) hoặc đầy đủ theo quyền.
5. Frontend xác thực/chuẩn hóa dữ liệu bằng Zod (`postSchema`) và render danh sách thẻ bài viết.
6. Nếu còn trang tiếp theo (`hasMore = true`), hiển thị nút **"Tải thêm bài viết"**.
7. Người dùng bấm "Tải thêm" (hoặc cuộn tới cuối) → gọi `fetchNextPage()` lấy trang kế tiếp và nối vào danh sách.
8. Người dùng có thể chọn tab lọc (All / Achievements / Hiring / Events) → tạo query mới theo loại bài viết.

## 6. Luồng phụ / Luồng ngoại lệ (Alternative / Exception Flows)

| Mã | Tình huống | Xử lý |
| :--- | :--- | :--- |
| **E1** | Không có bài viết nào | Hiển thị trạng thái rỗng "Chưa có bài viết nào" (No posts yet). |
| **E2** | Lỗi mạng / API thất bại (MSG05) | Hiển thị thẻ lỗi kèm nút **"Thử lại"** gọi `refetch()`; phần đã tải vẫn giữ nguyên. |
| **E3** | Token hết hạn (401) | `http` interceptor tự gọi `/auth/refresh` một lần rồi thử lại; nếu thất bại → chuyển hướng `/login`. |
| **E4** | Guest cố đăng bài / tương tác | Ẩn ô soạn bài, thay bằng lời mời đăng nhập; các nút tương tác bị vô hiệu (BR-12 / MSG28). |
| **E5** | Một phần tử dữ liệu hỏng định dạng | `postSchema.safeParse` loại bỏ phần tử lỗi, phần còn lại vẫn hiển thị (không sập trang). |

---

## 7. Quy tắc nghiệp vụ (Business Rules)

- **BR-08 / BR-11**: Bài viết đã bị ẩn/gỡ không xuất hiện trong kết quả (backend loại bỏ).
- **BR-12**: Guest chỉ xem bài viết công khai (PUBLIC) và không được đăng bài/tương tác.
- Tham số `page` / `size` được backend kiểm tra và giới hạn trong khoảng an toàn.

---

## 8. Phạm vi triển khai đợt này

- ✅ **Frontend (UC-244)**: bảng tin, phân trang/infinite scroll, lọc theo loại,
  RBAC theo vai trò, đầy đủ trạng thái loading/empty/error/permission, tích hợp
  API qua tầng data-layer (`axios` + `TanStack Query` + `Zustand` + `Zod`).
- ⛔ **Backend (UC-245)**: ngoài phạm vi đợt này. Khi backend sẵn sàng, đặt
  `VITE_REQUIRE_AUTH=true` để Frontend gọi API thật thay cho dữ liệu mock.
