# CÂU LỆNH PROMPT TIÊU CHUẨN (COPY TOÀN BỘ NỘI DUNG DƯỚI ĐÂY GỬI CHO AI CHAT)

```text
Hãy đọc kỹ tệp quy tắc `rule.md` ở thư mục gốc và tệp quy trình phát triển `docs/Workflow.md` để nắm rõ quy trình vận hành và quy ước viết code của dự án. Sau đó, thực hiện phân tích và triển khai tính năng theo đặc tả yêu cầu dưới đây:

---

### 1. THÔNG TIN CHUNG (GENERAL INFO)
*   Tên tính năng: [Ví dụ: Đăng nhập bằng Google / Quên mật khẩu]
*   Mã số Use Case / SRS ID: [Ví dụ: UC02, UC03...]

### 2. ĐẶC TẢ CHI TIẾT (NỘI DUNG TỪ TÀI LIỆU SRS)
*   [Dán nội dung mô tả nghiệp vụ, các bước tương tác, validation, business rules...]

---

### YÊU CẦU BẮT BUỘC ĐỐI VỚI AI ASSISTANT:
1. Đọc hiểu cấu trúc DB và cấu trúc code Backend/Frontend hiện có.
2. Nếu có thay đổi database (thêm bảng, thêm cột, cập nhật constraint...), bắt buộc sinh file migration SQL mới tại `alumnect-backend/src/main/resources/db/migration/` theo đúng định dạng tên `V<Version_Tiếp_Theo>__<mô_tả>.sql`. Viết SQL bằng từ khóa IN HOA, snake_case, khai báo khóa ngoại và INDEX rõ ràng.
3. Lập trình mã nguồn Backend (Spring Boot + Java) đúng chuẩn Layered + Feature, viết Javadoc và comment hoàn toàn bằng Tiếng Việt. Thực hiện validate đầu vào đầy đủ ở DTO Request bằng Tiếng Việt và cấu hình exception handling qua GlobalExceptionHandler.
4. Lập trình mã nguồn Frontend (React + Vite + TS) theo chuẩn Enterprise Feature-Based Architecture. Thiết kế giao diện tông màu Pastel Premium, rounded-3xl, sử dụng Zustand và React Query, comment Tiếng Việt đầy đủ.
5. Cập nhật các trường hợp test API (thành công, validation fail, conflict...) vào tệp `postman_collection.json` với đầy đủ method, url, header, raw body JSON và mô tả Markdown chi tiết kèm mã lỗi mong muốn.
6. Tự động sinh ra tệp đặc tả tài liệu SRS hoàn chỉnh cho riêng Use Case này tại `docs/update_SRS/SRS_UC_[Mã_UC]_[Tên_Tính_Năng].md` bằng cách sao chép và điền đầy đủ thông tin từ khuôn mẫu chuẩn tại tệp `docs/update_SRS/TemplateSRS.md`. Tài liệu phải viết bằng Tiếng Việt, khớp 100% với cấu trúc mã nguồn đã lập trình và tuyệt đối không sử dụng từ khóa `database` trong sơ đồ tuần tự Mermaid (thay thế bằng `participant`).
```
