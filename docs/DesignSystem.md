# HỆ THỐNG THIẾT KẾ (DESIGN SYSTEM & BRANDING GUIDELINES)

Tài liệu này định nghĩa hệ thống thiết kế (Design System), bảng màu (Color Palette), kiểu chữ (Typography), hiệu ứng (Effects) và các nguyên tắc UX/UI của dự án **AlumNect**. Đây là nguồn gốc duy nhất của sự thật (Single Source of Truth) cho việc thiết kế giao diện phía Frontend.

---

## 1. PHONG CÁCH CHỦ ĐẠO (DESIGN DIRECTION)

Dự án hướng tới một **cộng đồng cựu sinh viên ấm áp, gần gũi, mang đậm tính nhân văn** nhưng vẫn mang lại cảm giác **cao cấp, sang trọng (premium)** — tránh thiết kế theo hướng bảng điều khiển kỹ thuật khô khan (cold tech/dark dashboard).

*   **Không gian**: Sử dụng nền màu kem ấm (`cream`) kết hợp các hiệu ứng chuyển màu pastel mềm mại.
*   **Thành phần**: Các thẻ trắng mềm (`pillowy white cards`), viền bo tròn lớn (`rounded-3xl`), bóng đổ nhẹ nhàng và các tương tác micro-interactions thân thiện.
*   **Màu văn bản**: Sử dụng màu mực mận chín ấm áp (`plum`) thay cho màu đen/xám thuần để tăng cảm giác mềm mại và sang trọng.

---

## 2. BẢNG MÀU CHUẨN (COLOR PALETTE)

Các màu sắc được định nghĩa trong `src/index.css` qua hệ thống Tailwind v4 `@theme`:

| Nhóm Màu | Tên Token | Mã Màu (Hex) | Vai Trò |
| :--- | :--- | :--- | :--- |
| **Nền Canvas** | `--color-ink-900` / `cream-100` | `#faf4ec` | Màu nền chính ấm áp của toàn bộ trang web |
| **Bề Mặt Thẻ** | `--color-ink-850` / `cream-50` | `#ffffff` | Màu nền của các thẻ (`card-surface`), bảng biểu |
| **Chữ Mực Mận** | `--color-plum-900` | `#322c3f` | Màu tiêu đề (`h1`, `h2`, `h3`...) cực kỳ tương phản |
| **Chữ Thường** | `--color-plum-600` | `#6a6178` | Màu chữ nội dung chính, đạt chuẩn WCAG-AA |
| **Thương Hiệu** | `--color-brand-500` | `#7f86ee` | Màu tím oải hương chủ đạo (Periwinkle / Lavender) |
| **Tím Đậm** | `--color-violet-500` | `#ad85e6` | Màu nhấn bổ trợ, tạo cảm giác huyền ảo |
| **San Hô** | `--color-coral-500` | `#fb8366` | Màu cam san hô/đào, mang lại cảm giác ấm áp |
| **Bạc Hà** | `--color-mint-500` | `#5ecb9b` | Màu xanh bạc hà, biểu thị trạng thái thành công |
| **Da Trời** | `--color-sky-500` | `#5fb2ef` | Xanh da trời, biểu thị thông tin, liên kết |
| **Thủy Lam** | `--color-aqua-500` | `#29adbe` | Xanh ngọc lam, nhấn mạnh và tạo điểm nhấn |
| **Vàng Hoàng Kim**| `--color-gold-500` | `#efaf3e` | Màu vàng kim, biểu thị huy hiệu cựu sinh viên ưu tú |

---

## 3. HỆ THỐNG KIỂU CHỮ (TYPOGRAPHY)

*   **Font Tiêu Đề (Display Font)**: `Sora`, `Plus Jakarta Sans`, sans-serif. Tạo cảm giác bo tròn, hiện đại và thân thiện.
*   **Font Nội Dung (Body Font)**: `Plus Jakarta Sans`, `Inter`, sans-serif. Đảm bảo khả năng đọc dễ dàng ở kích thước nhỏ.
*   **Font Giao Diện (UI Font)**: `Inter`, sans-serif. Tối ưu cho các thành phần điều khiển, nút bấm, menu.

---

## 4. HIỆU ỨNG ĐẶC BIỆT & COMPOSITE UTILITIES

*   **Chữ Chuyển Màu (`.text-gradient`)**: Tạo hiệu ứng chữ gradient mượt mà chuyển từ tím thương hiệu sang cam san hô:
    `linear-gradient(110deg, #6c72e4 0%, #ad85e6 45%, #fb8366 100%)`
*   **Hiệu Ứng Kính Mờ (`.glass` / `.glass-strong`)**: Lớp phủ nền mờ sang trọng, lý tưởng cho Navbar và Modals.
*   **Thẻ Pillowy (`.card-surface`)**: Tạo chiều sâu cho các thẻ thông tin nhờ bóng đổ thông số:
    `box-shadow: 0 1px 0 0 rgb(255 255 255 / 0.7) inset, 0 18px 44px -22px rgb(120 100 140 / 0.3)`
*   **Spotlight Hover (`.spotlight`)**: Hiệu ứng vòng sáng theo con trỏ chuột khi di chuyển qua thẻ.
*   **Viền Chuyển Màu (`.ring-gradient`)**: Đường viền pixel mỏng gradient tạo nét tinh tế cao cấp.

---

## 5. HỆ THỐNG HOẠT ẢNH (MICRO-ANIMATIONS)

*   **`float` / `bob`**: Bài viết, hình ảnh trôi nổi nhẹ nhàng.
*   **`breathe`**: Thổi hồn vào các vòng sáng, quả cầu nền giúp giao diện sống động.
*   **`marquee`**: Dải chạy ngang mượt mà cho các logo, lời chứng thực, tự động tạm dừng khi di chuột.
*   **`sheen`**: Hiệu ứng ánh sáng quét qua bề mặt nút bấm khi di chuột qua (`hover-sheen`).
*   **`pop`**: Hiệu ứng xuất hiện đàn hồi nhẹ cho các modal và popup.

---

## 6. NGUYÊN TẮC UX/UI BẮT BUỘC (UX RULES)

1.  **Tính Nhất Quán Trong Điều Hướng (Navigation Consistency)**:
    *   Thanh điều hướng chính ở trên (Top Header) cho các trang ứng dụng thành viên và Admin (có cấu trúc AppShell, AdminShell).
    *   Tất cả tabs phải có hover tooltip và thanh gạch dưới chuyển động mượt mà khi kích hoạt.
2.  **Trạng Thái Trống & Tải Dữ Liệu (Empty & Loading States)**:
    *   Không để màn hình trống trơn khi không có dữ liệu. Sử dụng component `EmptyState` chuẩn (chứa hình minh họa pastel mềm mại và nút kêu gọi hành động).
    *   Khi đang tải dữ liệu từ API, sử dụng hiệu ứng xương (`shimmer skeleton`) có tông màu kem nhẹ, tránh dùng vòng xoay loading cổ điển gây khó chịu thị giác.
3.  **Xử Lý Ảnh Lỗi (Broken Images Guard)**:
    *   Mọi ảnh bìa, ảnh bài viết phải bọc trong component `SmartImage` để tự động hiển thị shimmer khi đang tải và ảnh fallback pastel khi ảnh nguồn bị lỗi.
    *   Avatar người dùng nếu lỗi sẽ tự động chuyển sang hiển thị chữ cái đầu tiên (initials) trên nền màu pastel ngẫu nhiên.
4.  **Khả Năng Tiếp Cận (WCAG-AA Accessibility)**:
    *   Đảm bảo độ tương phản của tất cả văn bản trên nền kem đạt chuẩn WCAG-AA (đã tối hóa màu `plum-600` và các màu nhấn).
    *   Tôn trọng cài đặt hệ thống của người dùng (`prefers-reduced-motion`) để tắt/giảm các hiệu ứng hoạt ảnh phức tạp nếu thiết bị yêu cầu.
