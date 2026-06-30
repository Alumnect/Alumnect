# PROJECT OPERATING PROTOCOL & WORKFLOW RULES

Chào mừng bạn đến với tài liệu Quy Trình Vận Hành Dự Án **AlumNect**. Tài liệu này định nghĩa các nguyên tắc phát triển phần mềm, chuẩn mực viết mã, quản lý tài liệu và quy trình nghiệm thu bắt buộc đối với toàn bộ các thành viên và AI coding assistant tham gia dự án.

---

## 1. NGUYÊN TẮC CỐT LÕI (CORE PRINCIPLES)

Dự án tuân thủ nghiêm ngặt mô hình phát triển:
*   **Documentation Driven Development (DDD)**: Tài liệu là nguồn gốc duy nhất của sự thật (Single Source of Truth). Code không được viết nếu không có tài liệu mô tả yêu cầu hoặc đặc tả hệ thống tương ứng.
*   **Specification Driven Development (SDD)**: Mọi chức năng phải có Đặc tả yêu cầu phần mềm (SRS), Use Case (UC) chi tiết trước khi tiến hành triển khai.
*   **Design Driven Development (Design System First)**: Thiết kế giao diện và hệ thống Design Token phải được đồng bộ hóa và khai báo trước khi viết UI Components.

---

## 2. QUY CHUẨN NGÔN NGỮ & COMMENT TRONG DỰ ÁN

*   **Trong Mã Nguồn (Source Code)**:
    *   **Tên biến, hàm, lớp (class), giao diện (interface), gói (package), thư mục, tệp tin**: Bắt buộc viết bằng **Tiếng Anh** (English) chuẩn và tuân thủ CamelCase/snake_case tùy theo công nghệ (xem chi tiết ở `docs/CodingConvention.md`).
    *   **Comment trong code**: Bắt buộc viết bằng **Tiếng Việt**.
    *   **Quy tắc Comment**: Mỗi hàm, phương thức (Method) được tạo mới hoặc sửa đổi đều phải có comment giải thích rõ ràng ngay phía trên hàm theo định dạng:
        ```java
        /**
         * [Tên chức năng của hàm bằng Tiếng Việt]
         * Mô tả chi tiết: [Mô tả ngắn gọn luồng xử lý hoặc nhiệm vụ của hàm bằng Tiếng Việt]
         * @param [Tên tham số] [Mô tả tham số bằng Tiếng Việt]
         * @return [Mô tả kết quả trả về bằng Tiếng Việt]
         */
        ```
*   **Trong Tài Liệu (Documentation & Markdown)**:
    *   Toàn bộ các file tài liệu thiết kế, SRS, Use Case, mô tả luồng chạy và giải thích hệ thống phát sinh hoặc cập nhật đều phải viết bằng **Tiếng Việt** (trừ tên biến hoặc tên hàm bắt buộc giữ nguyên Tiếng Anh để đối chiếu).

---

## 3. CẤU TRÚC THƯ MỤC TÀI LIỆU (DOCUMENTATION STRUCTURE)

Để đảm bảo dự án gọn gàng và dễ tra cứu, toàn bộ tài liệu được tổ chức như sau:

```text
Alumnect/ (Root)
│
├── rule.md                     # File quy tắc chung này (nằm ở thư mục gốc)
│
└── docs/                       # Thư mục tổng chứa tất cả tài liệu .md
    ├── SRS.md                  # Tài liệu đặc tả yêu cầu (SRS) gốc của hệ thống
    ├── Architecture.md         # Kiến trúc hệ thống (Spring Boot Backend + React Frontend)
    ├── FolderStructure.md      # Cấu trúc chi tiết thư mục mã nguồn
    ├── CodingConvention.md     # Quy ước đặt tên, viết code, cách comment Tiếng Việt
    ├── Database.md             # Thiết kế database, ERD và quy tắc migration
    ├── Api.md                  # Tài liệu định nghĩa API Endpoints
    ├── DesignSystem.md         # Hệ thống Design Tokens, bảng màu, typography, UI/UX Rules
    │
    └── update_SRS/             # Thư mục con chứa các file cập nhật SRS & luồng code sau khi code xong
        ├── UC_[Tên_UseCase_1].md
        ├── Flow_[Tên_UseCase_1].md
        └── ...
```

---

## 4. QUY TRÌNH PHÁT TRIỂN & CẬP NHẬT TÍNH NĂNG (FEATURE WORKFLOW)

Khi nhận được yêu cầu phát triển hoặc chỉnh sửa một tính năng, các bước sau đây bắt buộc phải được thực hiện theo đúng trình tự:

### Bước 1: Nghiên cứu và Thiết kế (Research & Plan)
1. Đọc và hiểu kỹ tài liệu SRS tổng hợp tại `README.md` của dự án.
2. Tra cứu cấu trúc dữ liệu, API cần thiết trong các file tài liệu tương ứng tại thư mục `docs/`.
3. Lập kế hoạch triển khai (Implementation Plan) trước khi viết code.

### Bước 2: Lập trình (Coding Phase)
1. Viết code bằng **Tiếng Anh** trên cấu trúc backend/frontend có sẵn.
2. Thêm comment chi tiết bằng **Tiếng Việt** phía trên từng hàm/phương thức.
3. Không duplication logic, tận dụng tối đa các components dùng chung (`src/components` ở frontend) và design tokens đã định nghĩa ở `docs/DesignSystem.md`.

### Bước 3: Cập nhật tài liệu SRS & Mô tả luồng chạy (Documentation Phase - Bắt buộc)
Ngay sau khi hoàn thành phần lập trình (coding) của một tính năng, bắt buộc phải tự động sinh ra **2 tệp tin** tại thư mục `docs/update_SRS/` phục vụ cho việc đọc và review luồng chạy:

#### 1. Tài liệu Use Case: `docs/update_SRS/UC_[Tên_Chức_Năng].md`
Nội dung tệp tin phải tuân thủ cấu trúc sau:
*   **Tên Use Case & Mã số (ID)** (Ví dụ: UC01 - Đăng ký tài khoản)
*   **Tác nhân (Actors)** (Ví dụ: Khách vãng lai - Guest)
*   **Điều kiện tiên quyết (Preconditions)**
*   **Điều kiện sau khi thực hiện (Postconditions)**
*   **Luồng sự kiện chính (Main Flow)**: Từng bước tương tác chi tiết giữa Người dùng và Hệ thống.
*   **Luồng phụ/Luồng ngoại lệ (Alternative/Exception Flows)**: Xử lý lỗi validation, lỗi trùng lặp dữ liệu, lỗi kết nối...
*   **Quy tắc nghiệp vụ (Business Rules)** liên quan.

#### 2. Tài liệu mô tả luồng chạy mã nguồn: `docs/update_SRS/Flow_[Tên_Chức_Năng].md`
Nội dung tệp tin giúp review code dễ dàng, bao gồm:
*   **Sơ đồ luồng (Sequence/Flow Diagram)**: Sử dụng cú pháp Mermaid vẽ luồng tương tác giữa các lớp Frontend và Backend.
*   **Mô tả các lớp (Classes) và hàm (Functions) tham gia**:
    *   *Frontend*: Các component, hook, api, và store.
    *   *Backend*: Controller, Service, Repository, DTO, Entity.
*   **Luồng xử lý dữ liệu chi tiết**: Các bước truyền tải dữ liệu DTO từ Frontend qua HTTP, validate ở Backend, xử lý nghiệp vụ ở Service, lưu trữ dữ liệu tại DB và phản hồi ngược lại Client.

### Bước 4: Kiểm tra và Nghiệm thu (Verification & Final Checklist)
1. Kiểm tra tính đồng bộ giữa: **Tài liệu SRS mới cập nhật <-> Mã nguồn đã viết <-> Design System**.
2. Đảm bảo code chạy đúng, không phát sinh lỗi biên dịch hoặc lỗi runtime.
3. Báo cáo kết quả và chỉ ra các tài liệu đã được cập nhật/tạo mới trong thư mục `docs/update_SRS/` để người dùng kiểm duyệt.

---

## 5. XỬ LÝ KHI PHÁT SINH LỖI HOẶC SAI SRS
Nếu trong quá trình code phát hiện sự sai lệch so với tài liệu SRS ban đầu, phải dừng lại, cập nhật tài liệu SRS tương ứng trong `docs/update_SRS/` và báo cáo cho người dùng trước khi tiếp tục code. Mọi thay đổi vi phạm quy chuẩn này sẽ bị từ chối phê duyệt và phải làm lại từ đầu.

