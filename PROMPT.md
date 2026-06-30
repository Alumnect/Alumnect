# CÂU LỆNH PROMPT TIÊU CHUẨN (COPY TOÀN BỘ NỘI DUNG DƯỚI ĐÂY GỬI CHO AI CHAT)

```text
Hãy đọc file `rule.md` ở thư mục gốc để nắm rõ quy trình vận hành dự án, sau đó thực hiện phân tích và triển khai tính năng theo đặc tả yêu cầu dưới đây:

---

### 1. THÔNG TIN CHUNG (GENERAL INFO)
*   Tên tính năng: [Điền tên tính năng vào đây]
*   Mã số Use Case / SRS ID: [Ví dụ: UC25, UC14... nếu có]

### 2. ĐẶC TẢ CHI TIẾT (NỘI DUNG TỪ TÀI LIỆU SRS)
*   [Dán nội dung mô tả, luồng nghiệp vụ, business rules từ tài liệu SRS vào đây...]

---

### YÊU CẦU BẮT BUỘC ĐỐI VỚI AI ASSISTANT:
1. Bắt buộc viết comment Tiếng Việt chi tiết ngay trên mỗi hàm/phương thức để giải thích chức năng, tham số và kết quả.
2. Thiết kế giao diện đúng chuẩn tông màu Pastel Premium, viền rounded-3xl và hiệu ứng được đặc tả trong docs/DesignSystem.md.
3. Sau khi hoàn thành code, tự động tạo 2 tệp tin bằng Tiếng Việt: UC_[Tên_Tính_Năng].md (đặc tả use case) và Flow_[Tên_Tính_Năng].md (sơ đồ Mermaid và luồng chạy code chi tiết) trong thư mục docs/update_SRS/.
```
