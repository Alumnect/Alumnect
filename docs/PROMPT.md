# CÂU LỆNH PROMPT TIÊU CHUẨN (COPY TOÀN BỘ NỘI DUNG DƯỚI ĐÂY GỬI CHO AI CHAT)

```text
Hãy đọc kỹ tệp quy trình phát triển và quy tắc code tại [Workflow.md](Alumnect/docs/Workflow.md) và tệp mẫu đặc tả tại [TemplateSRS.md](file:///d:/Alumnect/docs/update_SRS/TemplateSRS.md). Sau đó, thực hiện khảo sát cấu trúc mã nguồn, cơ sở dữ liệu hiện tại của dự án kết hợp với yêu cầu chức năng vắn tắt dưới đây để lập trình toàn bộ (Backend + Frontend), kiểm thử và tự động sinh tài liệu đặc tả SRS chi tiết dựa trên code thực tế đã viết:

---

### 1. THÔNG TIN CHUNG (GENERAL INFO)
*   Tên tính năng: [Ví dụ: Đăng nhập bằng Google / Xem lịch sử thanh toán]
*   Mã số Use Case / SRS ID: [Ví dụ: UC02, UC03...]

### 2. YÊU CẦU CHỨC NĂNG VẮN TẮT (BRIEF REQUIREMENTS)
*   [Dán yêu cầu tính năng vắn tắt, mô tả ý tưởng hoặc các chức năng mong muốn của người dùng để làm cơ sở phát triển]

---

### CHỈ THỊ BẮT BUỘC ĐỐI VỚI AI ASSISTANT (TUÂN THỦ 100%):

*   **Nghiên cứu toàn diện mã nguồn và cấu trúc DB hiện tại**: Trước khi bắt đầu viết code, AI Assistant bắt buộc phải chủ động rà soát, đọc hiểu toàn bộ các tệp tin, lớp cấu hình, các bảng database và logic hiện có trong dự án. Việc này giúp AI có cái nhìn tổng quan sâu sắc về dự án, nắm bắt chính xác cách luân chuyển dữ liệu và quan hệ nghiệp vụ, từ đó đưa ra giải pháp lập trình mới có logic chặt chẽ, tối ưu và tích hợp một cách tự nhiên nhất với toàn bộ hệ thống (tận dụng lại các config Security, WebMvc, Global Exception ở Backend và các Primitives, Hooks, Layout ở Frontend).

1. **GIAI ĐOẠN 1: THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE MIGRATION)**
   * Đọc cấu trúc cơ sở dữ liệu hiện tại. Tạo file SQL migration mới tại `alumnect-backend/src/main/resources/db/migration/V<Version_Tiếp_Theo>__<mô_tả>.sql`.
   * SQL viết hoa toàn bộ từ khóa, tên bảng/cột dạng snake_case. Định nghĩa khóa ngoại bằng `ALTER TABLE` ở cuối file, tạo đầy đủ `INDEX` cho khóa ngoại/cột tìm kiếm, dùng `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY` làm khóa chính.

2. **GIAI ĐOẠN 2: LẬP TRÌNH BACKEND (SPRING BOOT)**
   * Code đúng kiến trúc Layered + Feature. Viết comment & Javadoc chi tiết bằng **Tiếng Việt** (code bằng Tiếng Anh).
   * Validate dữ liệu đầu vào trong DTO bằng Tiếng Việt. Trả về format chuẩn `ResponseEntity<ApiResponse<T>>` (error=0 thành công, error=-1 hoặc HTTP status nếu lỗi).
   * Xử lý ngoại lệ tập trung qua `GlobalExceptionHandler`. Sử dụng phân trang `PageResponse<T>` cho các API GET lấy danh sách.
   * Chạy lệnh biên dịch `./mvnw clean compile` để kiểm tra lỗi cú pháp và kích hoạt sinh code MapStruct tự động.

3. **GIAI ĐOẠN 3: POSTMAN COLLECTION, KIỂM THỬ & FILE REVIEW**
   * Cập nhật các request API thành công/thất bại vào tệp `postman_collection.json` tại thư mục gốc.
   * API Đăng nhập (nếu có) phải cấu hình script trong tab **Tests** để tự động lưu JWT token vào biến `jwtToken`. Các API khác sử dụng Bearer Token kế thừa `{{jwtToken}}`.
   * Thực hiện khởi chạy server và chạy kiểm thử tự động toàn bộ API bằng Newman:
     `npx newman run postman_collection.json --env-var "baseUrl=http://localhost:8080"`
   * Tạo tệp `Review_Backend_[Mã_UC]_[Tên_Tính_Năng].md` tại thư mục gốc chứa kết quả chạy test Newman/curl làm bằng chứng kiểm thử trước khi chuyển sang Frontend. Tệp này được cấu hình bỏ qua trong `.gitignore`.

4. **GIAI ĐOẠN 4: LẬP TRÌNH FRONTEND (REACT + TS)**
   * Code đúng kiến trúc Feature-Based (tạo thư mục riêng trong `src/features/[feature_name]/`, dùng file `index.ts` để barrel export). Các component giao diện lớn hoặc phức tạp của feature phải được chia tách riêng biệt và lưu trữ tại thư mục `/components` (ví dụ: `RegisterForm.tsx`, `OtpVerification.tsx`) để tối ưu tính tái sử dụng và kiểm soát mã nguồn.
   * Áp dụng nghiêm ngặt Hệ thống Nhận diện Giao diện Pastel Premium đã tích hợp ở mục 4 của `Workflow.md` (nền canvas kem ấm `#faf4ec`, surface trắng `#ffffff`, chữ mực mận `#322c3f`/`#6a6178`, tím lavender `#7f86ee`, các hiệu ứng kính mờ, text gradient, hoạt ảnh float/breathe/sheen/pop).
   * Tái sử dụng các UI components dùng chung tại `primitives.tsx` (`<Card>`, `<Avatar>`, `<Skeleton>`, `<EmptyState>`) và `<SmartImage />`.
   * Sử dụng `react-hook-form` + `zod` để validate form phía client (định nghĩa các thông điệp lỗi của Zod schema giống khớp 100% với các thông báo trong Backend DTO), React Query để quản lý query/mutation cache, Zustand để quản lý global client state.
   * Chạy lệnh kiểm tra biên dịch Frontend bằng `npm run build` hoặc `npx tsc --noEmit` trước khi bàn giao.
   * Bắt buộc trích xuất và hiển thị trực tiếp thông điệp lỗi nghiệp vụ trả về từ Backend (qua `error.message` của mutation/query được `http.ts` đóng gói từ `ApiResponse.message`) lên Alert Banner hoặc Toast thông báo lỗi của giao diện người dùng.
   * Tạo tệp `Review_Frontend_[Mã_UC]_[Tên_Tính_Năng].md` tại thư mục gốc chứa nhật ký (log) chạy build thành công làm bằng chứng trước khi bàn giao và sinh tài liệu đặc tả. Tệp này được cấu hình bỏ qua trong `.gitignore`.


5. **GIAI ĐOẠN 5: SINH TÀI LIỆU ĐẶC TẢ SRS CHI TIẾT**
   * Tạo tệp `docs/update_SRS/SRS_UC_[Mã_UC]_[Tên_Tính_Năng].md` sao chép từ tệp mẫu `TemplateSRS.md`.
   * Biểu đồ lớp (Class Diagram) và Sơ đồ tuần tự (Sequence Diagram) phải khớp 100% với code thực tế.
   * Sơ đồ tuần tự (Sequence Diagram) phải được gộp chung thành **một sơ đồ duy nhất** (chứa cả kịch bản thành công và lỗi rẽ nhánh qua các khối `alt/else`), không dùng từ khóa `database` (sử dụng `participant DB as PostgreSQL`).
   * Phải viết đầy đủ phần **mô tả chi tiết bằng chữ** đi kèm bên dưới các sơ đồ Mermaid theo hướng dẫn trong file mẫu.

6. **GIAI ĐOẠN 6: KIỂM TRA SỰ NHẤT QUÁN & TẠO FILE REVIEW SRS VS CODE**
   * Thực hiện kiểm tra chéo cực kỳ chặt chẽ giữa tài liệu đặc tả SRS mới tạo/cập nhật và mã nguồn thực tế (Backend + Frontend).
   * Tạo tệp `Review_SRS_vs_Code_[Mã_UC]_[Tên_Tính_Năng].md` tại thư mục gốc của dự án chứa báo cáo chi tiết sự nhất quán (kết quả so khớp nghiệp vụ, DTO, Validation, Class Diagram, Sequence Diagram, UI Form, OTP Screen, và danh sách 12 error messages kèm checklist hành động). Tệp này được cấu hình bỏ qua trong `.gitignore`.
```
