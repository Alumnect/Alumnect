# CÂU LỆNH PROMPT TIÊU CHUẨN (COPY TOÀN BỘ NỘI DUNG DƯỚI ĐÂY GỬI CHO AI CHAT)

```text
Hãy đọc kỹ tệp quy tắc `rule.md` ở thư mục gốc để nắm rõ quy trình vận hành và quy ước viết code của dự án. Sau đó, thực hiện phân tích và triển khai tính năng theo đặc tả yêu cầu dưới đây:

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
6. Tự động sinh ra tệp đặc tả tài liệu SRS hoàn chỉnh cho riêng Use Case này tại `docs/update_SRS/SRS_UC_[Mã_UC]_[Tên_Tính_Năng].md`. Tài liệu phải viết bằng Tiếng Việt và có đầy đủ 2 phần:
   - **Phần 1: Đặc tả Nghiệp vụ (Report 3)**:
     - 2.2.3 Business Workflow (vẽ bằng sơ đồ Mermaid State hoặc Activity Diagram)
     - 3.2 Tên Module -> 3.2.1 Tên chức năng (mục tiêu, tác nhân, mô tả nghiệp vụ, không cần hình ảnh màn hình)
     - 5 Requirement Appendix (5.1 Business Rules, 5.2 Common Requirement nếu có, 5.3 Application Messages List bảng kê chi tiết các thông điệp phản hồi hệ thống, 5.4 Other Requirement)
   - **Phần 2: Thiết kế Chi tiết (Report 4)**:
     - 3 Detail Design -> 3.1 Tên chức năng
     - 3.1.1 Class Diagram (vẽ bằng Mermaid Class mô tả các lớp Backend & Frontend tham gia)
     - 3.1.2 Sequence Diagram Name 1 (Mermaid Sequence cho luồng thành công)
     - 3.1.3 Sequence Diagram Name 2, 3... (Mermaid Sequence cho các luồng ngoại lệ/thất bại như lỗi validation, trùng dữ liệu)
```
