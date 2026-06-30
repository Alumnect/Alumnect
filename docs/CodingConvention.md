# QUY ƯỚC VIẾT CODE (CODING CONVENTION & STYLE GUIDE)

Tài liệu này định nghĩa các quy chuẩn viết code, quy ước đặt tên và phong cách lập trình bắt buộc trong dự án **AlumNect**.

---

## 1. QUY CHUẨN NGÔN NGỮ & QUY TẮC COMMENT (QUAN TRỌNG NHẤT)

### 1.1. Ngôn Ngữ Trong Dự Án
*   **Tên biến, hàm, lớp (class), giao diện (interface), gói (package), thư mục, tệp tin**: Bắt buộc viết hoàn toàn bằng **Tiếng Anh**.
*   **Các chuỗi văn bản thông báo cho người dùng cuối (User Messages, Toasts)**: Viết bằng **Tiếng Việt** (hoặc đa ngôn ngữ tùy theo cấu hình).
*   **Tài liệu mô tả, các file SRS, Use Case phát sinh, sơ đồ luồng chạy**: Viết hoàn toàn bằng **Tiếng Việt**.

### 1.2. Quy Tắc Comment Trực Tiếp Trên Hàm (Code Commenting Rule)
*   **Comment giải thích code**: Phải viết bằng **Tiếng Việt**.
*   **Bắt buộc**: Mọi hàm, phương thức (method) được tạo mới hoặc sửa đổi phải có một khối comment chuẩn (Javadoc/TSdoc) ngay phía trên để mô tả chức năng của hàm, các tham số đầu vào và giá trị trả về.

#### Ví dụ đối với Backend (Java):
```java
/**
 * Tạo mới một bài viết trên Bản tin cộng đồng.
 * Khởi tạo dữ liệu bài đăng, xử lý lưu trữ hình ảnh nếu có và kích hoạt thông báo đến followers.
 * 
 * @param request Đối tượng DTO chứa tiêu đề, nội dung và các thẻ của bài viết.
 * @param authorId ID của người dùng là tác giả bài viết.
 * @return Đối tượng PostResponse chứa thông tin bài viết sau khi được tạo thành công.
 */
public PostResponse createPost(PostCreateRequest request, String authorId) {
    // Nội dung xử lý hàm
}
```

#### Ví dụ đối với Frontend (TypeScript):
```typescript
/**
 * Định dạng số tiền từ kiểu số sang chuỗi tiền tệ Việt Nam Đồng (VND).
 * Ví dụ: 150000 -> "150.000 đ"
 * 
 * @param amount Giá trị số cần định dạng.
 * @return Chuỗi tiền tệ đã được định dạng.
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
```

---

## 2. QUY CHUẨN ĐẶT TÊN (NAMING CONVENTIONS)

### 2.1. Đối Với Backend (Java)
*   **Tên lớp / Interface / Enum**: Sử dụng `PascalCase` (Ký tự đầu viết hoa).
    *   Ví dụ: `UserController`, `PostService`, `UserRepository`, `RoleType`.
*   **Tên hàm / Tên biến**: Sử dụng `camelCase` (Ký tự đầu viết thường).
    *   Ví dụ: `getPostById()`, `userId`, `createPost()`.
*   **Tên hằng số (Constants)**: Sử dụng `UPPER_CASE_SNAKE_CASE`.
    *   Ví dụ: `MAX_UPLOAD_SIZE`, `DEFAULT_PAGE_SIZE`.
*   **Tên thư mục gói (Packages)**: Viết thường toàn bộ không dấu cách hay gạch dưới.
    *   Ví dụ: `com.alumnect.alumnect_backend.controller.post`.

### 2.2. Đối Với Frontend (TypeScript & React)
*   **Tên Component và Page**: Sử dụng `PascalCase`.
    *   Ví dụ: `Button.tsx`, `LoginForm.tsx`, `FeedPage.tsx`.
*   **Tên file phụ trợ (helper, service, hook, utils, schema)**: Sử dụng `camelCase`.
    *   Ví dụ: `authApi.ts`, `useAuthStore.ts`, `formatDate.ts`, `bookSchema.ts`.
*   **Tên biến / Tên hàm**: Sử dụng `camelCase`.
    *   Ví dụ: `const [isOpen, setIsOpen] = useState(false);`, `const handleClose = () => {}`.
*   **Tên file Styles / CSS**: Sử dụng `camelCase` hoặc `kebab-case`.
    *   Ví dụ: `index.css`, `app.css`.

---

## 3. QUY CHUẨN CHO BACKEND (SPRING BOOT BEST PRACTICES)

1.  **Dùng DTO cho Endpoint**:
    *   Tuyệt đối không truyền trực tiếp Entity từ database ra ngoài Client để tránh lộ các trường bảo mật và lỗi vòng lặp tuần tự hóa.
    *   Sử dụng `@Valid` ở Controller để bắt lỗi dữ liệu đầu vào sớm nhất.
2.  **Logic Nghiệp Vụ Nằm Ở Service**:
    *   Controller chỉ nhận yêu cầu, kiểm tra cú pháp thô bằng `@Valid` và định dạng phản hồi (`ResponseEntity`).
    *   DAO/Repository chỉ xử lý truy vấn SQL.
    *   Mọi tính toán logic nghiệp vụ phức tạp phải viết trong `ServiceImp`.
3.  **Xử Lý Lỗi Tập Trung**:
    *   Khi xảy ra lỗi logic nghiệp vụ, hãy ném (`throw`) Custom Exception (như `BadRequestException`, `ConflictException`).
    *   `GlobalExceptionHandler` sẽ tự động bắt lấy và format JSON lỗi chuẩn trả về cho client.
4.  **Sử Dụng `@Transactional`**:
    *   Mọi phương thức ghi (Insert, Update, Delete) nhiều bảng trong `Service` cần được gắn `@Transactional` để đảm bảo tính toàn vẹn dữ liệu.

---

## 4. QUY CHUẨN CHO FRONTEND (REACT & TYPESCRIPT BEST PRACTICES)

1.  **Strict TypeScript**:
    *   Bắt buộc bật strict mode trong tsconfig.
    *   Sử dụng `import type` khi import types để tối ưu hóa bundle size (`verbatimModuleSyntax`).
    *   Không lạm dụng kiểu `any`, cố gắng định nghĩa rõ ràng kiểu dữ liệu cho props và state.
2.  **Feature-Based Boundary**:
    *   Cấm viết import chéo sâu giữa các feature. Các feature chỉ giao tiếp qua tệp tin barrel `index.ts` ở thư mục gốc của feature đó.
    *   Ví dụ sai: `import { BookCard } from '@/features/book/components/BookCard'`
    *   Ví dụ đúng: `import { BookCard } from '@/features/book'`
3.  **Form & Schema Validation**:
    *   Sử dụng `React Hook Form` kết hợp với `Zod` để xây dựng biểu mẫu và validate.
    *   Schema của form phải được khai báo trong thư mục `model` của feature và xuất ra type tương ứng bằng `z.infer`.
4.  **UI & Tailwind CSS v4**:
    *   Tuân thủ thiết kế Design System sử dụng các biến CSS `@theme` đã thiết lập.
    *   Hạn chế viết inline style phức tạp, thay vào đó hãy sử dụng class Tailwind v4.
    *   Đảm bảo responsive hoạt động mượt mà trên cả thiết bị di động (Mobile First).
