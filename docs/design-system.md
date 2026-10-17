# Alumnect — Design System (đặc tả để thiết kế toàn hệ thống)

> **Trạng thái:** Chủ dự án ủy quyền chọn phương án phù hợp (mục 13 → đã chốt). Tiến độ: **Bước 1–12 xong (còn chờ duyệt cuối)** — xem mục 15.3.
> **Mục đích của file:** là nguồn sự thật duy nhất. Mọi lần làm giao diện sau này (do AI hoặc người) đều đọc file này trước, làm đúng theo đây, không tự chế style.
> **Phạm vi khảo sát:** `alumnect-frontend/src` — 255 file `.tsx`, 44 trang trong `pages/`, 19 module trong `features/` (lớn nhất: `mentorship` 89 file, `admin` 18, `group` 15, `user` 13, `message` 9, `feed` 7, `forum` 7, `event` 6).
> **Stack:** React 19, Vite 8, TypeScript, Tailwind 4 (CSS-first `@theme`), Framer Motion 12, Lucide, TanStack Query, Zustand. Chưa dùng shadcn/ui.
> **Đã khảo sát bằng:** đọc `index.css`, `Button`, `Modal`, `primitives`, `MentoringUi`, `AppShell`, `PostCard`; thống kê bằng grep toàn bộ `src/`; skill `ui-ux-pro-max`; MCP 21st.dev (tham khảo bố cục).

---

## 0. LUẬT BẮT BUỘC (đọc trước khi làm bất cứ gì)

Đây là các ràng buộc của chủ dự án. Vi phạm bất kỳ điều nào là làm sai.

1. **Chỉ sửa giao diện.** Được đổi: `className`, token/CSS, bố cục JSX thuần trình bày (thứ tự/bọc thẻ để layout), màu, font, spacing, bo góc, bóng, animation, icon trang trí.
2. **KHÔNG đổi logic.** Cấm đụng: state, hooks, gọi API, props và type (trừ thêm prop **tùy chọn thuần giao diện** như `className`), routing, tên hàm, điều kiện hiển thị theo quyền/vai trò, luồng xử lý, cấu trúc dữ liệu, query key.
3. **KHÔNG thêm/bớt chức năng.** Không thêm nút/tab/trường/trang mới, không xóa cái đang có, không đổi hành vi nút. Không đổi text/nhãn tiếng Việt nếu chủ dự án chưa yêu cầu.
4. **Dùng token và component dùng chung. Không hardcode** màu hex, spacing rời rạc (`mt-[13px]`), cỡ chữ tùy ý (`text-[11px]`), bo góc/bóng tùy ý.
5. **Light và dark mode phải cùng đúng.** Mọi thay đổi kiểm tra cả hai.
6. **Kiểm tra mobile** (375px) trước khi báo xong.
7. **Mỗi lần chỉ một bước** trong kế hoạch (mục 12). Xong bước: chạy build + type-check, liệt kê file đã đổi, xác nhận không đụng logic, **dừng chờ duyệt**.
8. **Không thêm thư viện mới** nếu chưa hỏi. Không cài component 21st/shadcn nguyên bản; chỉ lấy ý tưởng bố cục rồi viết lại theo token của dự án.
9. **Cấm “tiện tay” sửa thứ khác**: không refactor, không đổi tên file, không sửa bug logic trong lúc làm giao diện. Thấy bug thì ghi lại và báo, không tự sửa.

**Kiểm tra “không đụng logic” (bắt buộc sau mỗi bước):**
- `git diff` chỉ được thấy thay đổi ở: chuỗi `className`, `index.css`/file token, bọc/thứ tự thẻ JSX trình bày, import icon/component giao diện.
- Không được thấy thay đổi ở: `useState/useEffect/useQuery/useMutation`, hàm `handle*`, `onClick` (nội dung xử lý), `fetch/http`, điều kiện `if/&&/? :` quyết định hiển thị theo dữ liệu hoặc quyền, route path.
- Nếu một thay đổi giao diện buộc phải đụng logic → **dừng, báo chủ dự án**, không tự làm.

---

## 1. Khảo sát hiện trạng

### 1.1 Điểm mạnh nên giữ
- Bảng màu thương hiệu FPT nhất quán: cam `#F27024`, navy `#004F9E`, xanh lá `#009A3E`, vàng `#F59E0B`.
- Đã có `@theme` Tailwind 4, font Sora / Plus Jakarta Sans / Inter, easing mềm `cubic-bezier(.33,1,.68,1)` làm mặc định, `lib/motion.ts` có token chuyển động (`page 0.4s`, `content 0.32s`, `pop 0.26s`, `overlay 0.24s`, `exit 0.16s`).
- Component dùng chung đã có: `Button`/`ButtonLink` (6 variant, 3 size), `Card`, `Badge`, `Avatar`, `Skeleton`, `EmptyState`, `Modal` (dùng Portal, khóa cuộn, `role="dialog"`), `ConfirmModal`, `Toast`, `Pagination`, `SelectDropdown`, `PageHeader`.
- Module mentorship đã có bộ UI riêng khá chuẩn (`MentoringUi.tsx`: `MentoringBadge`, `MentoringActionCard`, `MentoringStatusStrip`, `MentoringActionButton`, `MentoringField`, `MentoringFilterTabs`, `MentoringStatTile`, `MentoringFormError`) — là **mẫu tốt** để nâng lên thành component dùng chung toàn app.
- Có `:focus-visible` toàn cục, 29 chỗ `prefers-reduced-motion`, 21 chỗ `useReducedMotion`. 211 file dùng Lucide (đồng nhất icon).
- Mentorship có bảng trạng thái → huy hiệu (`MentoringTaskBadge`: map status → label + tone + icon) — cách làm đúng, nên nhân rộng.

### 1.2 Vấn đề (số liệu đo trên toàn `src/`, gần đúng)

| # | Vấn đề | Số liệu | Hệ quả |
|---|--------|---------|--------|
| 1 | Dark mode viết bằng hex cứng `dark:bg-[#242526]`, `dark:text-[#b0b3b8]`… | ~1.992 lớp `dark:*-[#hex]`; ~2.524 hex trong `.tsx`; 175 file | Đổi một màu dark phải sửa hàng trăm chỗ |
| 2 | 3 cơ chế dark mode chồng nhau: (a) token `ink/cream/plum` đổi giá trị theo `html.dark`, (b) ~300 dòng `html.dark .bg-white{…}` trong `index.css`, (c) `dark:` từng component | 3 lớp | Màu cuối khó đoán, khó debug |
| 3 | Cùng vai trò nhưng nhiều màu: nền dark `#18191a #1c1d1f #1e1f20 #242526 #2b2c2d #2e3033 #333537`; chữ phụ dark `#8a8d91 #8f9399 #a0a3a7 #b0b3b8` | 7+ nền, 4+ xám | Không đồng tông |
| 4 | Cam thương hiệu viết cứng `#F27024` ~254 lần, kèm `#ff8c38 #d45105 #d96010` | 254+ | Không đổi brand tại một chỗ |
| 5 | Tên token gây hiểu nhầm: `ink-*` = nền sáng, `plum-*` = xám slate, `violet-*` = navy FPT, `mint-500` = xanh FPT | — | Dễ dùng sai |
| 6 | Chữ cỡ tùy ý: `text-[11px]` 347, `text-[10px]` 195, `text-[9px]` 15; `text-xs` 1.612 lần (đa số chữ nội dung) | ~564 chỗ <12px | Khó đọc trên mobile |
| 7 | 7 mức bo góc dùng song song: `rounded-xl` 777, `2xl` 514, `full` 456, `lg` 337, `3xl` 137, `md` 99, `rounded` 94 | 7 mức | Card/nút/input không cùng ngôn ngữ hình khối |
| 8 | Bóng nhiều mức: `shadow-sm` 205, `xs` 182, `2xs` 127, `md` 87, `2xl` 57…; token `shadow-soft/card` chỉ ~35 lần | ~10 mức | Không có hệ elevation |
| 9 | z-index rời: `z-10/20/30/40/50/60`, `z-[100]` (25 chỗ), `z-[9999]` (4), `z-[10000]` trong prop Modal | 8+ mức | Modal/dropdown/toast chồng sai |
| 10 | **Modal tự viết** `fixed inset-0` ở **51 file**, trong khi `<Modal>` dùng chung chỉ ở **28 file** | 51 vs 28 | Overlay/độ mờ/bo góc không đồng nhất (commit gần đây đã phải sửa nền modal mentorship) |
| 11 | **Nút tự viết** `<button>` 458 lần, `<Button>/<ButtonLink>` chỉ 422 lần; chiều cao nút `h-8` 135, `h-9` 79, `h-10` 120, `h-11` 58, `h-12` 52 | — | Nút không đồng bộ; nhiều nút <44px (khó chạm mobile) |
| 12 | **Input tự viết** gần như mọi nơi: 235 thẻ `<input>/<textarea>/<select>`, không có component `Input` chung; padding lẫn `py-2/2.5/3`, `px-3/3.5/4` | 235 | Form không đồng nhất; focus ring khác nhau |
| 13 | **Hai bộ tone màu trạng thái**: `BadgeTone` (9: brand, gold, aqua, violet, neutral, success, danger, mint, rose) và `MentoringTone` (6: brand, navy, mint, coral, gold, neutral), cộng màu Tailwind rời: amber 533, rose 330, violet 244, emerald 203, red 106, purple 82, blue 79, orange 56, sky 35, indigo 19 | 2 bộ + ~10 họ màu | “Thành công/Cảnh báo/Lỗi” mỗi nơi một màu |
| 14 | Xám: `slate` 1.503 lần + `plum-*` (alias slate) + `gray` 21 | 3 tên cho 1 thang | Nên chỉ còn token ngữ nghĩa |
| 15 | Tab: chỉ 1 chỗ có `role="tablist"`, còn lại tab tự dựng bằng button (mentorship có `MentoringFilterTabs`) | — | Thiếu a11y, không đồng nhất |
| 16 | Bảng dữ liệu: 14 file dùng `<table>` (admin, ví mentoring, subscription) mỗi nơi tự style | 14 | Không có component `Table` chung, mobile dễ tràn ngang |
| 17 | `style={{}}` inline ở 26 file | 26 | Bypass token |
| 18 | CSS/animation thừa trong `index.css`: `aurora-blob` (0 chỗ dùng), `AuroraBackground` (chỉ `NotFoundPage`), `spotlight` (chỉ `TiltCard`), `ring-gradient` (chỉ `SubscriptionPage`), marquee/blob/twinkle… | — | Code chết, có thể dọn |
| 19 | Độ tương phản: nút primary dùng chữ trắng trên nền cam `#F27024` ≈ **2,95:1** (dưới chuẩn 4,5:1 cho chữ thường) | — | Xem mục 3.2 |
| 20 | Kích thước container trang không đồng nhất: `max-w-2xl` 9, `6xl` 8, `xl` 7, `5xl` 7, `3xl` 4, và `max-w-[1560px]` ở AppShell | — | Xem mục 6.2 |
| 21 | Nút icon `h-8 w-8` (135 chỗ), `h-6 w-6` (77) | — | Dưới 44px, khó chạm mobile |

### 1.3 Nhận định về thể loại sản phẩm
Alumnect là **mạng xã hội nghề nghiệp** (feed, nhóm, diễn đàn, kết nối, tin nhắn, thông báo, sự kiện, việc làm, bản đồ cựu sinh viên) kèm **module Mentoring có tiền tệ** (ví, ký quỹ, tranh chấp, hoàn tiền, ledger) và **khu Admin**. Hệ thống phải phục vụ ba “chế độ” trình bày: (A) *đọc nhiều, quét nhanh* (feed/diễn đàn), (B) *giao dịch, tin cậy, rõ trạng thái* (mentoring/ví/admin), (C) *công cụ dày dữ liệu* (bảng admin). Hiệu ứng trang trí gần như không dùng trong app thật nên **không phải vấn đề**; vấn đề thật là màu/kích thước/thành phần rải rác.

### 1.4 Kết quả skill `ui-ux-pro-max` và quyết định
Truy vấn: *"social network alumni community mentorship feed"* → style “Vibrant & Block-based”, màu hồng-đỏ `#E11D48`, font Inter + Playfair Display. **Không áp dụng nguyên bản**: phá nhận diện FPT, và serif cho chữ thân không hợp mạng xã hội. Giữ lại từ skill: tương phản ≥4,5:1, focus rõ, tôn trọng `prefers-reduced-motion`, chuyển động 150–300ms, vùng chạm ≥44px, khoảng cách giữa các mục chạm ≥8px, icon vector (không emoji làm icon), kiểm thử ở 375/768/1024/1440px, không phụ thuộc hover, nhãn cho nút chỉ có icon.

**Hướng thiết kế chốt đề xuất: “Warm & Clean Community”** — nền sạch như Facebook/LinkedIn, card phẳng, nhấn cam FPT có chủ đích, navy cho thông tin/tin cậy, xanh lá cho thành công; dark mode kiểu Facebook (đã có).

---

## 2. Kiến trúc token (cách làm để “đổi một chỗ là đồng bộ toàn hệ thống”)

Ba lớp, đặt trong `src/index.css`:

1. **Lớp giá trị (`:root` / `html.dark`)** — biến thô `--c-*`, mỗi biến có giá trị light và dark. **Đây là nơi duy nhất chứa mã hex của UI.**
2. **Lớp ánh xạ (`@theme inline`)** — biến Tailwind `--color-*` trỏ về `--c-*`, để dùng được `bg-surface`, `text-muted`… Vì trỏ về biến, dark mode tự đổi, **component không cần viết `dark:`**.
3. **Lớp component** — `Button`, `Card`, `Input`… dùng utility ngữ nghĩa; không chứa hex.

Ngoại lệ được phép có `dark:`: ảnh/overlay đặc biệt, hiệu ứng riêng (ví dụ nền ảnh `bg-black/40`), không phải màu bề mặt/chữ/viền.

**Tương thích ngược (quan trọng):** giữ nguyên tên token cũ (`ink-*`, `cream-*`, `plum-*`, `brand-*`, `violet-*`, `mint-*`, `coral-*`, `gold-*`, `primary-*`) nhưng trỏ về biến mới, để trang chưa chuyển vẫn chạy y nguyên. Xóa sau khi toàn bộ đã chuyển (bước 9).

### 2.1 CSS token đầy đủ (dán vào `index.css` ở bước 1)

```css
/* ===== LỚP 1: giá trị theo chế độ ===== */
:root {
  /* Bề mặt */
  --c-bg: #f8fafc;
  --c-surface: #ffffff;
  --c-surface-2: #f1f5f9;       /* input, nền phụ, hover nền */
  --c-surface-3: #e2e8f0;       /* skeleton, chip trung tính */
  --c-overlay: rgb(15 23 42 / 0.45);

  /* Viền */
  --c-border: #e2e8f0;
  --c-border-strong: #cbd5e1;

  /* Chữ */
  --c-text: #0f172a;
  --c-text-muted: #475569;
  --c-text-subtle: #64748b;
  --c-text-disabled: #94a3b8;
  --c-text-inverse: #ffffff;

  /* Thương hiệu */
  --c-primary: #f27024;          /* nhận diện: icon, viền, vòng focus, chữ lớn */
  --c-primary-solid: #c2410c;    /* nền nút/ chữ nhỏ cần tương phản ≥4.5:1 với chữ trắng */
  --c-primary-hover: #9a3412;
  --c-primary-soft: #fff4ec;     /* nền nhẹ cho chip/hàng chọn */
  --c-primary-soft-border: #fec7a8;
  --c-on-primary: #ffffff;

  --c-info: #004f9e;             /* navy FPT */
  --c-info-soft: #e8f0fa;
  --c-info-border: #b9d0ec;

  --c-success: #047857;
  --c-success-soft: #ecfdf5;
  --c-success-border: #a7f3d0;

  --c-warning: #b45309;
  --c-warning-soft: #fffbeb;
  --c-warning-border: #fde68a;

  --c-danger: #be123c;
  --c-danger-soft: #fff1f2;
  --c-danger-border: #fecdd3;

  --c-focus: #f27024;

  /* Bóng */
  --shadow-card: 0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.06);
  --shadow-raised: 0 6px 16px -4px rgb(15 23 42 / 0.12), 0 2px 4px rgb(15 23 42 / 0.06);
  --shadow-overlay: 0 20px 48px -12px rgb(15 23 42 / 0.28);
}

html.dark {
  color-scheme: dark;
  --c-bg: #18191a;
  --c-surface: #242526;
  --c-surface-2: #3a3b3c;
  --c-surface-3: #4e4f50;
  --c-overlay: rgb(0 0 0 / 0.65);

  --c-border: #393a3b;
  --c-border-strong: #4e4f50;

  --c-text: #e4e6eb;
  --c-text-muted: #b0b3b8;
  --c-text-subtle: #8f9399;
  --c-text-disabled: #65676b;
  --c-text-inverse: #18191a;

  --c-primary: #ff8c38;
  --c-primary-solid: #f27024;    /* dark: chữ trên nút dùng --c-on-primary-dark (xem 3.2) */
  --c-primary-hover: #ff8c38;
  --c-primary-soft: #2d2621;
  --c-primary-soft-border: #4a382b;
  --c-on-primary: #18191a;

  --c-info: #7cb7ff;
  --c-info-soft: #1f2a3a;
  --c-info-border: #2d4466;

  --c-success: #4ade80;
  --c-success-soft: #14261c;
  --c-success-border: #1f4a30;

  --c-warning: #fbbf24;
  --c-warning-soft: #2a2417;
  --c-warning-border: #4d3f17;

  --c-danger: #fb7185;
  --c-danger-soft: #2d1a1f;
  --c-danger-border: #55252f;

  --c-focus: #ff8c38;

  --shadow-card: 0 1px 2px rgb(0 0 0 / 0.5);
  --shadow-raised: 0 8px 20px rgb(0 0 0 / 0.55);
  --shadow-overlay: 0 24px 56px rgb(0 0 0 / 0.7);
}

/* ===== LỚP 2: ánh xạ sang Tailwind ===== */
@theme inline {
  --color-bg: var(--c-bg);
  --color-surface: var(--c-surface);
  --color-surface-2: var(--c-surface-2);
  --color-surface-3: var(--c-surface-3);
  --color-overlay: var(--c-overlay);
  --color-border: var(--c-border);
  --color-border-strong: var(--c-border-strong);
  --color-text: var(--c-text);
  --color-text-muted: var(--c-text-muted);
  --color-text-subtle: var(--c-text-subtle);
  --color-text-disabled: var(--c-text-disabled);
  --color-text-inverse: var(--c-text-inverse);
  --color-primary: var(--c-primary);
  --color-primary-solid: var(--c-primary-solid);
  --color-primary-hover: var(--c-primary-hover);
  --color-primary-soft: var(--c-primary-soft);
  --color-primary-soft-border: var(--c-primary-soft-border);
  --color-on-primary: var(--c-on-primary);
  --color-info: var(--c-info);
  --color-info-soft: var(--c-info-soft);
  --color-info-border: var(--c-info-border);
  --color-success: var(--c-success);
  --color-success-soft: var(--c-success-soft);
  --color-success-border: var(--c-success-border);
  --color-warning: var(--c-warning);
  --color-warning-soft: var(--c-warning-soft);
  --color-warning-border: var(--c-warning-border);
  --color-danger: var(--c-danger);
  --color-danger-soft: var(--c-danger-soft);
  --color-danger-border: var(--c-danger-border);
  --color-focus: var(--c-focus);

  --shadow-card: var(--shadow-card);
  --shadow-raised: var(--shadow-raised);
  --shadow-overlay: var(--shadow-overlay);

  --radius-sm: 0.5rem;   /* 8px  */
  --radius-md: 0.75rem;  /* 12px */
  --radius-lg: 1rem;     /* 16px */
  /* giữ --radius-xl/2xl/3xl cũ trong giai đoạn chuyển, xóa ở bước 9 */

  --z-sticky: 20;
  --z-nav: 30;
  --z-dropdown: 40;
  --z-overlay: 50;
  --z-modal: 60;
  --z-toast: 70;
}
```

> Lưu ý kỹ thuật: tên biến `--shadow-card` có thể trùng giữa lớp 1 và lớp 2. Khi làm bước 1 sẽ đặt tên lớp 1 là `--c-shadow-*` để tránh vòng lặp. Đây chỉ là chi tiết triển khai, không đổi quy tắc.

### 2.2 Bảng chuyển đổi className (chỉ đổi className — dùng cho mọi bước)

| Hiện tại (light + dark) | Thay bằng |
|---|---|
| `bg-white dark:bg-[#242526]` / `bg-white dark:bg-[#1c1d1f]` | `bg-surface` |
| `bg-slate-50` / `bg-gray-50` + `dark:bg-[#18191a]` | `bg-bg` |
| `bg-slate-100` / `bg-cream-100` + `dark:bg-[#3a3b3c]` | `bg-surface-2` |
| `bg-slate-200` + `dark:bg-[#4e4f50]` | `bg-surface-3` |
| `text-slate-900/800` + `dark:text-[#f0f2f5]/#e4e6eb` | `text-text` |
| `text-slate-600/500` + `dark:text-[#b0b3b8]` | `text-text-muted` |
| `text-slate-400` + `dark:text-[#8a8d91]/#8f9399` | `text-text-subtle` (chỉ cỡ ≥12px) |
| `border-slate-200` + `dark:border-[#393a3b]` | `border-border` |
| `border-slate-300` + `dark:border-[#4e4f50]` | `border-border-strong` |
| `text-[#F27024]` (chữ/icon lớn) | `text-primary` |
| `text-[#F27024]` (chữ nhỏ trên nền sáng) | `text-primary-solid` |
| `bg-[#F27024]`, `bg-gradient-to-r from-[#F27024] to-[#FF8C38]` (nút) | `bg-primary-solid text-on-primary hover:bg-primary-hover` (xem 3.2) |
| `bg-[#F27024]/10`, `bg-orange-50`, `bg-brand-50` | `bg-primary-soft` |
| `text-emerald-*`, `bg-emerald-*`, `mint-*` (thành công) | `text-success` / `bg-success-soft` / `border-success-border` |
| `text-amber-*`, `bg-amber-*`, `gold-*` (cảnh báo/chờ) | `text-warning` / `bg-warning-soft` |
| `text-rose-*`, `red-*`, `coral-*` (lỗi/nguy hiểm) | `text-danger` / `bg-danger-soft` |
| `text-violet-*`, `sky-*`, `blue-*`, `indigo-*`, `aqua-*` (thông tin) | `text-info` / `bg-info-soft` |
| `text-[10px]`, `text-[11px]`, `text-[9px]` | `text-xs` (12px) |
| `rounded-md`, `rounded` | `rounded-sm`/`rounded-md` (xem 3.5) |
| `rounded-xl` / `rounded-2xl` / `rounded-3xl` | theo bảng bo góc 3.5 |
| `shadow-xs/2xs/sm/md/lg/xl/2xl` | `shadow-card` / `shadow-raised` / `shadow-overlay` |
| `z-[100]`, `z-[9999]`, `z-[10000]` | token z-index 3.7 |

> `purple` (82), `orange` (56), `teal`, `green`: kiểm từng chỗ; thường là điểm nhấn ad-hoc → quy về `primary`/`info`/`success`. Trường hợp “achievement/thành tích” dùng vàng riêng được giữ như một ngoại lệ có tên (`warning` hoặc token `--c-achievement` nếu chủ dự án muốn).

---

## 3. Nền tảng thị giác

### 3.1 Triết lý
Nội dung là nhân vật chính; giao diện lùi lại. Nền sạch, card phẳng, màu nhấn ít mà có ý nghĩa: **cam = hành động chính/nhận diện; navy = thông tin/tin cậy; xanh lá = thành công; vàng cam = chờ/chú ý; đỏ = nguy hiểm/lỗi**. Không dùng màu làm nguồn thông tin duy nhất (luôn kèm chữ/icon).

### 3.2 Màu & tương phản (đã tính)
- Chữ chính `--c-text` trên `--c-surface`: ≥ 15:1 (đạt).
- `--c-text-muted` `#475569` trên trắng ≈ 7,6:1; dark `#b0b3b8` trên `#242526` ≈ 7:1 (đạt).
- `--c-text-subtle` `#64748b` trên trắng ≈ 4,8:1 (đạt, chỉ dùng cỡ ≥12px); dark `#8f9399` trên `#242526` ≈ 4,7:1 (đạt).
- **Cam `#F27024` trên trắng ≈ 2,95:1 — KHÔNG đạt 4,5:1.** Hiện nút primary dùng chữ trắng trên nền cam (và gradient `#F27024→#FF8C38`) → dưới chuẩn cho chữ thường. Đề xuất:
  - Nền nút primary và chữ cam nhỏ dùng `--c-primary-solid` `#C2410C` (chữ trắng trên đó ≈ 5,2:1, đạt). Cam thương hiệu `#F27024` giữ cho icon, viền, vòng focus, nền nhẹ, chữ lớn đậm ≥18px, và logo.
  - Trade-off: nút primary sẽ **sẫm hơn một chút** so với hiện tại. **Cần chủ dự án quyết định** (mục 13, câu 1). Nếu không muốn đổi, phương án B: giữ nền `#F27024` và dùng chữ **đậm màu slate-900 `#0F172A`** (tương phản ≈ 6:1) — nhưng đổi màu chữ nút trắng → đen có thể làm lệch cảm giác thương hiệu.
- Dark mode: nền nút primary `#F27024`/chữ `--c-on-primary` `#18191A` (tương phản ≈ 6:1, đạt) hoặc nền `#FF8C38` chữ tối.
- Trạng thái (success/warning/danger/info) đã chọn sắc đậm cho chữ trên nền `*-soft` đạt ≥4,5:1; kiểm lại bằng công cụ khi triển khai bước 1.
- **Cấm** `text-slate-400` / `#999` cho chữ nội dung; cấm chữ xám trên nền xám.

### 3.3 Typography
Font giữ nguyên: **Sora** (heading), **Plus Jakarta Sans** (thân), **Inter** (UI nhỏ/số). Hỗ trợ tiếng Việt đầy đủ, không đổi font.

| Token | Cỡ / dòng | Trọng lượng | Dùng cho |
|---|---|---|---|
| `text-xs` (caption) | 12 / 16 | 500 | Timestamp, badge, chú thích, nhãn bảng. **Tối thiểu của cả hệ thống** |
| `text-sm` | 14 / 20 | 400–600 | Meta, nhãn form, bảng, danh sách dày, nút nhỏ |
| `text-base` | 16 / 24 | 400 | **Nội dung bài đăng, bình luận, mô tả** (mặc định) |
| `text-lg` | 18 / 28 | 600 | Tiêu đề card |
| `text-xl` | 20 / 28 | 700 | Tiêu đề mục |
| `text-2xl` | 24 / 32 | 700 | Tiêu đề trang |
| `text-3xl` | 30 / 36 | 700 | Hero/landing/auth |

Quy tắc: heading dùng Sora, `letter-spacing: -0.02em` (đã có). Số tiền/ledger dùng `tabular-nums` căn phải. Độ dài dòng nội dung ≤ ~70 ký tự. Giới hạn dòng tiêu đề card bằng `truncate`/`line-clamp` (không để vỡ layout). Chữ nội dung bài đăng **16px** (hiện đang 14px `text-sm`).

### 3.4 Spacing & lưới
Lưới 4px. Chỉ dùng thang Tailwind: `1 2 3 4 6 8 12 16` (4/8/12/16/24/32/48/64px). Cấm giá trị tùy ý `mt-[13px]`.

| Ngữ cảnh | Mobile | ≥ md |
|---|---|---|
| Padding card | `p-4` | `p-5` |
| Khoảng cách giữa card trong feed | `gap-3` | `gap-4` |
| Khoảng cách giữa section | `gap-6` | `gap-8` |
| Padding ngang trang | `px-4` | `px-6` / `px-8` |
| Khoảng cách giữa các nút chạm | ≥ `gap-2` (8px) | — |

### 3.5 Bo góc (từ 7 mức → 4)

| Token | Giá trị | Dùng cho |
|---|---|---|
| `rounded-sm` | 8px | Chip, badge chữ nhật, tooltip, ô nhỏ |
| `rounded-md` | 12px | **Nút, input, dropdown, ô thống kê nhỏ** |
| `rounded-lg` | 16px | **Card, modal, bottom sheet, khối nội dung** |
| `rounded-full` | 9999px | Avatar, pill/badge tròn, FAB, nút icon tròn |

Quy đổi: `rounded-md/rounded` → `sm`; `rounded-lg/xl` → `md`; `rounded-2xl/3xl` → `lg`. Ảnh trong card dùng `rounded-md` hoặc `lg` theo ngữ cảnh. Bo góc khối lồng nhau: bên trong nhỏ hơn bên ngoài một bậc.

### 3.6 Bóng / elevation (từ ~10 → 3)

| Token | Dùng cho |
|---|---|
| `shadow-card` | Card feed, card danh sách (rất nhẹ; dark chỉ cần viền) |
| `shadow-raised` | Dropdown, popover, card hover, sticky header |
| `shadow-overlay` | Modal, bottom sheet, lightbox |

Không dùng bóng màu cam (`shadow-glow`) cho nút thường; vòng nhấn dùng `ring`. Dark mode ưu tiên **viền** thay vì bóng.

### 3.7 z-index
`--z-sticky 20` (thanh dính trong trang) · `--z-nav 30` (AppShell, bottom-nav, FAB) · `--z-dropdown 40` (menu, popover, tooltip) · `--z-overlay 50` (backdrop) · `--z-modal 60` (modal/bottom sheet) · `--z-toast 70`. Cấm `z-[100]`, `z-[9999]`, `z-[10000]`. Modal lồng nhau (mở modal từ modal): cho phép nâng thêm một bậc qua prop có sẵn, không dùng số tùy ý.

### 3.8 Chuyển động
Dùng lại `lib/motion.ts` (đã chuẩn); không tạo duration mới.

| Loại | Thời lượng | Easing |
|---|---|---|
| Hover/focus/nhấn/toggle | 120–200ms | `EASE_OUT` |
| Dropdown/tab/accordion | 200–250ms | `EASE_OUT` |
| Modal/bottom sheet vào | 250–300ms (`pop`/`overlay`), **thoát nhanh hơn** (~160ms, `exit`) | `EASE_OUT` / `EASE_IN` |
| Chuyển trang | ≤ 400ms (`page`) chỉ opacity + translate nhẹ | `EASE_OUT` |

Quy tắc: chỉ animate `transform` và `opacity` (không animate width/height/top/left; hiện còn `height` ở inline comments — giữ vì đang chạy ổn, không sửa logic). Mọi animation **tôn trọng `prefers-reduced-motion`**. Animation vô hạn (float, aurora, marquee, blob, twinkle, pulse-glow) **không dùng trong khu app** (chỉ landing/auth/404). Hiệu ứng `hover-lift` (nâng card) giữ có chọn lọc, không dùng cho mọi card trong feed dày. Tối đa 1 điểm nhấn chuyển động mỗi màn hình.

### 3.9 Icon & hình ảnh
- Chỉ **Lucide**, cỡ 16 / 20 / 24px, stroke mặc định; không dùng emoji làm icon cấu trúc (emoji trong nội dung người dùng thì giữ).
- Nút chỉ có icon **bắt buộc** có `aria-label` (thêm `aria-label` là thay đổi giao diện/a11y cho phép, không phải logic).
- Ảnh: `loading="lazy"`, có `aspect-ratio`/kích thước để tránh nhảy layout, `alt` có nghĩa. Avatar luôn có fallback chữ cái đầu (đã có).
- Ảnh/avatar chữ cái đầu: nền gradient hiện tại (`brand → violet`) giữ như điểm nhận diện nhưng chuyển sang token.

---

## 4. Trạng thái tương tác (áp dụng cho mọi component)

| Trạng thái | Quy tắc |
|---|---|
| Default | Dùng token bề mặt/chữ/viền ở mục 2–3 |
| Hover | Đổi nền nhẹ (`surface-2`) hoặc viền; không dịch layout; **không phụ thuộc hover** để lộ chức năng (mobile) |
| Focus (`:focus-visible`) | Vòng 2px `--c-focus`, offset 2px, tương phản ≥3:1; **không bao giờ** `outline-none` mà không thay thế |
| Active/pressed | `scale(0.97)` ~120ms (đã có `.press`) |
| Disabled | `opacity-50` + `pointer-events-none` + `aria-disabled` |
| Loading | Skeleton đúng kích thước nội dung; nút hiện spinner, **giữ nguyên chiều rộng**; thao tác >300ms phải có phản hồi |
| Empty | `EmptyState`: icon Lucide + 1 câu + (nếu đã có) 1 CTA hiện hữu |
| Error | Lỗi gần trường (không chỉ ở đầu form), màu `danger` + icon + câu giải thích (không chỉ màu) |
| Success | Toast tự tắt 3–5s, `aria-live="polite"` |
| Selected/Active (tab, nav) | Nền `primary-soft` + chữ `primary-solid` + (tùy) gạch dưới; có `aria-selected`/`aria-current` |

> Đối với “Empty/CTA”: chỉ **bố cục lại** thứ đã có; không thêm nút mới.

---

## 5. Thư viện component dùng chung (đặc tả)

Mọi component nằm trong `src/components/ui/`, xuất qua `index.ts`. **Khi gặp phần tử tự viết tương đương, thay bằng component này (chỉ thay lớp trình bày, giữ nguyên handler/props/điều kiện).** Không đổi chữ ký props hiện có; thêm prop `className` nếu thiếu.

### 5.1 `Button` / `ButtonLink` (đã có)
- Variant: `primary` (nền `primary-solid`, chữ `on-primary`), `secondary` (nền `surface`, viền `border-strong`), `outline`, `ghost`, `danger` (mới – tương ứng nút xóa/hủy đang tự viết), `gold` → đổi tên ngữ nghĩa `warning` (nếu đang dùng; giữ alias).
- Size: `sm` 36px (`h-9`), `md` 44px (`h-11`), `lg` 48px (`h-12`). **Hạ `h-8` (32px) trên thiết bị cảm ứng**: nút `sm` có `min-h-9` và vùng chạm mở rộng (`before:` hoặc padding) tới 44px trong khu vực danh sách dày; nút hành động chính luôn `md` trở lên trên mobile.
- Bo `rounded-md`; bỏ gradient + bóng cam; hover = đổi `primary-hover`; có spinner khi loading; icon trái/phải 16–20px; `focus-visible` ring chuẩn.
- Thay cho: 458 `<button>` tự viết (xử lý dần theo module; **chỉ khi nút có hình dạng nút chữ/CTA**, còn nút icon/ô chọn dùng `IconButton`).

### 5.2 `IconButton` (mới, thuần giao diện)
Nút chỉ có icon: vùng chạm **44×44px** (icon 20px bên trong), bo `rounded-full` hoặc `md`, bắt buộc `aria-label`, hover nền `surface-2`. Thay các `h-8 w-8`/`h-6 w-6` (135 + 77 chỗ). Dùng cho: menu `…`, đóng modal, lưu/bookmark, báo cáo, chuông, chuyển theme.

### 5.3 `Input` / `Textarea` / `Select` / `Field` (mới — hiện 235 thẻ tự viết)
- Cao 44px (`h-11`), `rounded-md`, nền `surface-2` hoặc `surface` + viền `border`, chữ `text-base` (tránh iOS tự zoom khi <16px), placeholder `text-subtle`.
- Focus: viền `primary` + `ring-2 ring-primary/25`; lỗi: viền `danger` + `aria-invalid` + thông báo dưới trường (`text-sm text-danger` + icon).
- `Field` = nhãn (luôn hiển thị, không dùng placeholder thay nhãn) + control + gợi ý + lỗi. Bắt nguồn từ `MentoringField`/`MentoringFormError` (đã có) — **nâng cấp chúng thành chung rồi cho `MentoringUi` dùng lại** (không đổi API cũ).
- `Textarea`: tối thiểu 3 dòng, `resize-y`. `Select`: giữ `SelectDropdown` hiện có, đồng bộ style.

### 5.4 `Card`
- Biến thể: `default` (phẳng: `bg-surface`, viền `border`, `rounded-lg`, `shadow-card`), `interactive` (có hover: `shadow-raised`/viền `border-strong`, `cursor-pointer`), `soft` (nền `surface-2`, không viền, cho khối lồng), `glass` (chỉ dùng cho hero/landing).
- Bỏ `rounded-3xl`, bỏ `group relative overflow-hidden` mặc định nếu không cần (vì ảnh hưởng dropdown bị cắt) — **cẩn trọng: chỉ đổi nếu không làm hỏng layout; kiểm từng chỗ**.
- Padding: `p-4 md:p-5`, header/body/footer dùng đường kẻ `border-border`.

### 5.5 `Badge` + hợp nhất tone trạng thái
Một bộ tone duy nhất cho **toàn app** (thay `BadgeTone` 9 giá trị và `MentoringTone` 6 giá trị):

| Tone | Ý nghĩa | Màu |
|---|---|---|
| `brand` | Nhận diện/đang diễn ra/hành động chính | `primary-soft` + `primary-solid` |
| `info` | Thông tin/đang xử lý/tin cậy (navy) | `info-soft` + `info` |
| `success` | Hoàn thành/đã xác minh/đã nhận | `success-soft` + `success` |
| `warning` | Chờ/cần chú ý/sắp hết hạn | `warning-soft` + `warning` |
| `danger` | Lỗi/tranh chấp/hủy/từ chối | `danger-soft` + `danger` |
| `neutral` | Trung tính/đã đóng | `surface-2` + `text-muted` |

Ánh xạ tên cũ (giữ alias trong giai đoạn chuyển, **không đổi giá trị truyền vào ở nơi gọi**): `aqua`,`violet`,`navy` → `info`; `mint`,`success` → `success`; `gold` → `warning`; `coral`,`rose`,`danger` → `danger`; `brand`,`neutral` giữ.
Badge: `rounded-full`, `text-xs`, **bỏ `uppercase tracking-wide` mặc định** (khó đọc với tiếng Việt có dấu; chỉ dùng cho nhãn ngắn), icon tùy chọn 12–14px, luôn có chữ (không chỉ màu). Trạng thái dạng enum (task, deal, ticket, report, verification…) luôn qua **một bảng ánh xạ `status → {label, tone, icon}`** như `MentoringTaskBadge` — tách thành mẫu chung.

### 5.6 `Avatar`
Cỡ chuẩn: 24, 32, 40, 48, 64, 96. Tròn; fallback chữ cái đầu trên nền token; vòng `ring` tùy chọn; dấu xác minh (`verified`) hiện là prop có nhưng chưa thấy hiển thị trong component — **ghi nhận, không tự thêm** (đó là thêm chức năng hiển thị; hỏi chủ dự án).

### 5.7 `Modal` / `ConfirmModal` / `BottomSheet`
- **Tất cả modal dùng `Modal` chung.** Hiện 51 file tự viết `fixed inset-0` — đây là hạng mục lớn nhất (bước 7–9). Khi thay: giữ nội dung/handler/`isOpen`/`onClose`, chỉ thay lớp vỏ.
- Vỏ: backdrop `bg-overlay` + `backdrop-blur-xs`; hộp `rounded-lg`, `bg-surface`, viền `border`, `shadow-overlay`, `max-h-[85vh]` cuộn nội dung; header có tiêu đề + nút đóng 44px; footer dính đáy; trap focus + `Esc` đóng + `aria-modal` (đã có phần lớn).
- **Mobile (<640px): hiển thị dạng bottom sheet** (bo trên 16px, sát đáy, có tay nắm, `max-h-[90vh]`, tôn trọng `safe-area-inset-bottom`). Đây là cách trình bày — không đổi logic mở/đóng.
- Kích thước: `sm` 400, `md` 512, `lg` 640, `xl` 768, `2xl` 960 (thay `maxWidthClassName` tùy ý).
- z-index theo token (3.7).

### 5.8 `Tabs` (mới, thay các tab tự dựng; nâng `MentoringFilterTabs`)
Hai kiểu: **underline** (điều hướng nội dung trong trang) và **pill/segmented** (bộ lọc). `role="tablist"/"tab"`, `aria-selected`, điều hướng bằng phím mũi tên, cuộn ngang trên mobile (`no-scrollbar`, `snap-x`), mục chạm ≥44px cao. Badge đếm bên cạnh nhãn.

### 5.9 `Table` / danh sách dữ liệu (mới; 14 file bảng)
- Desktop: header `text-xs font-semibold text-text-muted` nền `surface-2`, hàng `border-b border-border`, hover `surface-2`, chữ `text-sm`; số tiền `text-right tabular-nums`; cột trạng thái dùng Badge; hàng có thể bấm có `cursor-pointer` + focus.
- **Mobile: không để tràn ngang.** Hoặc bọc `overflow-x-auto` có chỉ báo cuộn, hoặc chuyển thành danh sách thẻ xếp chồng (mỗi hàng là một card với cặp nhãn–giá trị). Chọn theo bảng; ghi rõ ở bước làm.
- Sticky header cho bảng dài; phân trang dùng `Pagination` có sẵn.

### 5.10 `Skeleton`, `EmptyState`, `ErrorState`
- `Skeleton`: nền `surface-3`, shimmer nhẹ, **cùng kích thước nội dung thật**, tôn trọng reduced-motion. Có bộ mẫu: `PostSkeleton` (đã có), card, hàng bảng, hồ sơ.
- `EmptyState`: bỏ viền nét đứt + nền `white/50` cứng → `surface` + `border`, icon trong ô `primary-soft`; tiêu đề `text-lg`, mô tả `text-sm text-muted`.
- `ErrorState`: cùng khung với `EmptyState` nhưng icon/ màu `danger`; nội dung lỗi từ dữ liệu hiện có, không bịa thêm chức năng “Thử lại” nếu chưa có handler.

### 5.11 `Toast`, `Pagination`, `SelectDropdown`, `PageHeader`
- `Toast`: dùng tone chung (success/warning/danger/info), icon + chữ, z `--z-toast`, `aria-live`; góc trên-phải desktop, dưới-giữa mobile, né bottom-nav.
- `Pagination`: nút ≥44px trên mobile, rút gọn số trang khi hẹp.
- `SelectDropdown`: style trùng `Input`; panel `rounded-md`, `shadow-raised`, nền **opaque** `surface` (commit gần đây đã sửa lỗi nền trong suốt), z `--z-dropdown`.
- `PageHeader`: tiêu đề `text-2xl`, mô tả `text-sm text-muted`, vùng hành động nằm bên phải (desktop) / xuống dưới (mobile).

### 5.12 Các mẫu cấp cao dùng chung (tách từ mentoring)
`StatTile` (ô thống kê: nhãn caption + số lớn tabular), `StatusStrip` (dải thông báo trạng thái có icon + tone), `ActionCard` (thẻ có hành động chính), `FilterTabs`. Đang nằm trong `MentoringUi.tsx` — nâng lên `components/ui/` rồi cho mentoring import lại, **không đổi API**.

---

## 6. Layout & điều hướng

### 6.1 Điểm ngắt & lưới
Mobile-first. Điểm ngắt chuẩn: **375** (đảm bảo không vỡ) · `sm` 640 · `md` 768 · `lg` 1024 (đổi từ bottom-nav sang sidebar/top-nav như hiện tại) · `xl` 1280 · 1440 (kiểm thử). Không cuộn ngang ở bất kỳ điểm nào. Dùng `min-h-dvh` thay `100vh` cho khung toàn màn hình (tránh thanh địa chỉ mobile); tôn trọng `safe-area-inset-*` cho bottom-nav và bottom sheet.

### 6.2 Khung trang & container
| Loại trang | Container | Ví dụ |
|---|---|---|
| Đọc/feed (3 cột desktop: điều hướng · nội dung · gợi ý) | nội dung giữa tối đa ~680px, tổng `max-w-[1560px]` hiện có | Feed, Forum, Group |
| Chi tiết/form | `max-w-3xl` (768) | PostDetail, Profile edit, Create request |
| Danh sách/thư mục (lưới) | `max-w-6xl`–`7xl` | Alumni directory, Jobs, Mentors, Events |
| Dày dữ liệu (admin, ledger) | `max-w-7xl` hoặc full | Admin tables |
| Auth | `max-w-md` giữa màn hình | Login/Register |

Thống nhất **4 cỡ container**: `max-w-3xl`, `max-w-5xl`, `max-w-7xl`, và khung feed riêng — thay dần `2xl/xl/6xl/[640px]/[460px]` rời rạc.

### 6.3 Điều hướng
- **Desktop (≥lg):** thanh trên cố định (logo, tìm kiếm, nav chính, hành động, avatar) + (feed) sidebar trái/phải. Mục đang chọn: nền `primary-soft` + chữ `primary-solid` + `aria-current="page"`.
- **Mobile (<lg):** thanh trên gọn + **bottom-nav ≤5 mục** (icon 24px + nhãn, vùng chạm ≥44px, có trạng thái active rõ, `safe-area-inset-bottom`) + sheet “Thêm” cho mục còn lại (đã có). Không che nội dung: trang có `pb-28` (đã có) — giữ.
- **Admin:** `AdminShell` dùng cùng token; sidebar có thể thu gọn; trên mobile dạng drawer.
- Điều hướng quay lại luôn dự đoán được (giữ như hiện tại); không đổi route.

### 6.4 Lớp nổi (FAB, nút “lên đầu”, theme toggle)
Hiện ở `AppShell` có theme toggle dưới-trái và nút “lên đầu” dưới-phải (z 30). Thống nhất: dùng `IconButton` tròn 44px, bóng `shadow-raised`, đặt cách bottom-nav tối thiểu 8px, không chồng nội dung quan trọng, z `--z-nav`.

---

## 7. Đặc tả theo nhóm màn hình / module

Mỗi mục: **mẫu bố cục**, **component dùng**, **lưu ý**. (Chỉ trình bày; không đổi chức năng.)

### 7.1 Feed & bài đăng (`pages/app/FeedPage`, `PostDetailPage`, `features/feed`, `features/post`) — ưu tiên số 1
`PostCard` (đang là `export function PostCard` trong `FeedPage.tsx:132`):
- Khung: `Card` `interactive`, `rounded-lg`, viền `border`, nền `surface`; padding `p-4 md:p-5`.
- **Header:** `Avatar` 40–44px · tên (`text-base font-semibold`, hover `primary-solid`) · badge loại bài (tone chung) · hàng meta `text-xs text-text-subtle` (vai trò · thời gian) · `IconButton` menu `…` (44px).
- **Nội dung:** `text-base leading-relaxed text-text` (hiện `text-sm`).
- **Khối loại bài:** tuyển dụng / sự kiện / thành tích dùng `Card soft` + tone (`brand`/`info`/`warning`) thay gradient cam/indigo/vàng hardcode; nút “Ứng tuyển”/RSVP giữ component hiện có.
- **Media:** giữ lưới ảnh 1/2/3/4+ thông minh hiện có (điểm mạnh); bo `rounded-md`, viền `border`; `+N` overlay đặt token.
- **Thanh hành động:** chia **đều 3 ô** (Thích · Bình luận · Chia sẻ), mỗi ô cao ≥44px, icon 20px + nhãn tiếng Việt `text-sm`, vạch kẻ trên `border-border`; trạng thái đã thích = icon tim đặc + chữ `danger`; **Lưu** và **Báo cáo** là `IconButton` 44px ở cuối hàng (giữ nguyên điều kiện hiển thị `isAuthor/canReport/canInteract`).
- **Bình luận inline:** vùng mở rộng giữ animation hiện có; bình luận `text-sm`, avatar 32px, khung nhập dùng `Input`/`Textarea` chung.
- Skeleton đúng chiều cao thẻ để tránh CLS. Cuộn vô hạn/phân trang giữ nguyên.
- Tham chiếu 21st (chỉ ý tưởng): thanh hành động 3 ô chia đều; header 2 dòng gọn; link preview dạng thẻ con nền `surface-2`.

### 7.2 Diễn đàn & nhóm (`ForumPage`, `QuestionDetailPage`, `GroupsPage`, `GroupDetailPage`, `GroupPostDetailPage`, `features/forum`, `features/group`)
Tái dùng `PostCard`-style cho bài/câu hỏi nhóm (`GroupPostCard`); câu trả lời/bình luận dạng chuỗi có đường dẫn thụt lề tối đa 2 cấp trên mobile; thẻ nhóm = `Card interactive` + ảnh bìa tỉ lệ cố định + số thành viên (`text-xs`) + nút tham gia (`Button sm`, vùng chạm ≥44px); tab nhóm dùng `Tabs underline`.

### 7.3 Kết nối, hồ sơ, danh bạ (`AlumniDirectoryPage`, `ProfilePage`, `features/user`)
Thẻ người dùng (`UserDirectoryCard`, `ConnectionSuggestionCard`): lưới 1 / 2 / 3 / 4 cột theo breakpoint, avatar 64–96, tên + vai trò + công ty (truncate), nút kết nối/nhắn tin. **Bỏ `TiltCard`/spotlight** khỏi danh sách dày (hiệu ứng nghiêng gây xao nhãng và tốn hiệu năng) → hover nâng nhẹ. Hồ sơ: header (ảnh bìa + avatar chồng) + tab (Bài viết · Giới thiệu · …) + cột phụ; `SalaryPage`, `CareerPage` dùng `StatTile` + biểu đồ theo skill dataviz.

### 7.4 Tin nhắn & thông báo (`MessagesPage`, `NotificationsPage`, `features/message`, `features/notification`)
Tin nhắn: 2 cột desktop (danh sách | hội thoại), mobile là màn hình xếp chồng; bong bóng: của mình nền `primary-solid` chữ `on-primary`, của người khác nền `surface-2`; thời gian `text-xs`; ô soạn dính đáy với `Input` + `IconButton` gửi 44px; chấm chưa đọc `primary`, badge số có `aria-label`. Thông báo: danh sách hàng 56–72px, chưa đọc nền `primary-soft`, nhóm theo ngày.

### 7.5 Sự kiện, việc làm, bản đồ (`EventsPage`, `JobsPage`, `MapPage`, `features/event`, `features/alumnimap`)
Thẻ sự kiện/việc làm: ngày dạng ô nhỏ (`primary-soft`), tiêu đề `text-lg`, meta `text-sm` icon 16px, trạng thái bằng Badge; `EventRsvpButton` giữ logic. Bản đồ: popup (`vietmapgl`/`mapboxgl`) đã có CSS riêng — đồng bộ nền/viền/bo theo token và dark mode.

### 7.6 Mentoring (`pages/app/Mentor*`, `Mentoring*`, `features/mentorship` — 89 file)
Module lớn và có tiền: ưu tiên **rõ ràng, tin cậy, trạng thái minh bạch**.
- Dùng bộ `StatusStrip`/`ActionCard`/`StatTile`/`FilterTabs` (đã chung hóa), Badge tone chung, bảng ví/ledger bằng `Table` chung (số tiền `tabular-nums` căn phải, màu thu/chi bằng `success`/`danger` + dấu `+/−`, không chỉ màu).
- Quy trình nhiều bước (Preparation → In progress → Ending; deal; dispute; refund) dùng **stepper/timeline** nhất quán (`MentoringDealHistoryTimeline` làm mẫu).
- Modal nhiều (≈25 file `Mentoring*Modal`): chuyển hết sang `Modal` chung/bottom sheet mobile, form dùng `Field`.
- Màn thanh toán/QR (`MentorPaymentQrCard`…): khối QR nền trắng cố định cả dark mode (để quét được), viền rõ.
- Hành động nguy hiểm (hủy, hoàn tiền, tranh chấp) dùng `Button danger` + xác nhận (giữ `ConfirmModal` hiện có).
- Giữ nguyên toàn bộ luật nghiệp vụ/điều kiện hiện nút theo vai trò (requester/performer).

### 7.7 Admin (`features/admin` — 18 file, 14 bảng)
Mật độ cao: `text-sm`, hàng 44–48px, sidebar gọn; `StatTile` đầu trang; bảng chung (5.9); lọc bằng `Tabs pill` + `Input` tìm kiếm; hành động hàng bằng `IconButton`/menu; modal chi tiết (`AdminTaskLedgerDetailModal`…) dùng `Modal` chung. Mobile: bảng chuyển danh sách thẻ hoặc cuộn ngang có chỉ báo.

### 7.8 Auth, 404, landing (`pages/auth/*`, `NotFoundPage`, `SubscriptionPage`)
Đây là nơi duy nhất được dùng hiệu ứng trang trí (aurora, gradient chữ, `ring-gradient`) vì là điểm “giới thiệu thương hiệu”; vẫn dùng token, tôn trọng reduced-motion, đạt tương phản. Form dùng `Field`/`Input`/`Button` chung; nút mạng xã hội/đăng nhập có vùng chạm ≥44px.

---

## 8. Dark mode (quy tắc dứt điểm)
1. Một cơ chế duy nhất: biến `--c-*` đổi giá trị dưới `html.dark`. Component **không** viết `dark:bg-[#...]`.
2. Bề mặt dark theo bậc: `bg #18191a` → `surface #242526` → `surface-2 #3a3b3c` → `surface-3 #4e4f50`. Phân tách bằng **viền**, ít dùng bóng.
3. Chữ dark không trắng thuần cho đoạn dài: `#e4e6eb` (chính), `#b0b3b8` (phụ).
4. Màu trạng thái dark dùng sắc sáng hơn trên nền `*-soft` tối (đã chọn ở 2.1).
5. Ảnh/QR/logo cần nền sáng giữ bằng khung nền cố định, không đảo màu.
6. Sau khi token phủ hết: xóa ~300 dòng `html.dark .bg-white {…}` trong `index.css`.
7. Kiểm thử bắt buộc cả hai chế độ + chuyển đổi không nháy (đã có `color-scheme`).

---

## 9. Khả năng truy cập & hiệu năng (cổng bắt buộc)
- Tương phản ≥4,5:1 (chữ thường), ≥3:1 (chữ lớn/UI).
- Mọi phần tử bấm được truy cập bằng bàn phím, có focus nhìn thấy; thứ tự Tab hợp lý; modal bẫy focus và trả focus.
- Nút/icon không nhãn → thêm `aria-label`; trạng thái chuyển bằng `aria-pressed`/`aria-selected`/`aria-current`/`aria-expanded`; lỗi form `aria-invalid` + `aria-describedby`.
- Vùng chạm ≥44×44px, khoảng cách ≥8px.
- `prefers-reduced-motion` tôn trọng cho mọi animation (đã có hạ tầng `useReducedMotion`).
- Không phụ thuộc màu đơn thuần; không phụ thuộc hover.
- Ảnh lazy + giữ chỗ (CLS < 0,1); danh sách dài không render lại thừa (không đổi logic; chỉ ghi nhận cơ hội).
- Không cuộn ngang ở 375px.

---

## 10. Các thứ cần dọn (bước cuối)
- Token cũ không còn dùng: `ink-*`, `cream-*`, `plum-*`, `violet-*`(navy alias), `mint-*`, `coral-*`, `gold-*`, `aqua-*`, `sky-*`, `brand-*`/`primary-*` thang số (nếu đã thay bằng token ngữ nghĩa).
- CSS thừa: `aurora-blob`, `spotlight` (nếu bỏ `TiltCard`), marquee/blob/twinkle/pulse-glow nếu hết dùng, `.glass*` nếu không còn.
- Override `html.dark .bg-white…` (~300 dòng).
- Mỗi lần xóa phải `grep` xác nhận 0 chỗ dùng + build sạch.

---

## 11. Quy ước triển khai & kiểm chứng

**Cấm trong code mới/sửa:** hex trong `.tsx`; `dark:*-[#hex]`; `text-[Npx]` <12; `rounded-[...]`/`shadow-[...]` tùy ý; `z-[N]`; `style={{ color/background }}`; tên màu Tailwind thô (`slate-*`, `rose-*`, `amber-*`…) cho bề mặt/chữ/trạng thái; modal tự viết `fixed inset-0`.

**Lệnh kiểm tra (chạy ở `alumnect-frontend`):**
```bash
# hex còn lại ngoài file token
grep -rnE "#[0-9a-fA-F]{6}\b" src --include=*.tsx | wc -l
# dark hex cứng
grep -rnE "dark:(bg|text|border)-\[#" src --include=*.tsx | wc -l
# chữ dưới 12px
grep -rnE "text-\[(9|10|11)px\]" src --include=*.tsx | wc -l
# modal tự viết
grep -rln "fixed inset-0" src --include=*.tsx | wc -l
# z-index tùy ý
grep -rnE "z-\[[0-9]+\]" src --include=*.tsx | wc -l
# build + type-check
npm run build
```
(Số liệu mục tiêu ở mục 12.)

---

## 12. Kế hoạch triển khai (mỗi lần MỘT bước, dừng chờ duyệt)

Chuẩn bị: tạo nhánh `feature/ui-redesign` từ nhánh hiện tại; chụp ảnh màn hình mốc (light + dark; 375 & 1440) cho các trang chính.

| Bước | Nội dung | File chính | Rủi ro | Kiểm tra riêng |
|---|---|---|---|---|
| **1. Tokens** | Thêm lớp 1 + lớp 2 (mục 2.1) vào `index.css`; token cũ trỏ về token mới **giữ nguyên giá trị hiện tại**; chưa đổi component | `src/index.css` | Thấp (không đổi hình) | Build; so ảnh mốc: **phải giống hệt** |
| **2. Primitives cơ bản** | `Button` (variant `danger`, size, màu theo 3.2 nếu được duyệt), `IconButton`, `Badge` (tone chung + alias), `Card`, `Avatar`, `Skeleton`, `EmptyState`/`ErrorState` dùng token | `components/ui/*` | TB (ảnh hưởng toàn app) | Trang mẫu light/dark; xem Button/Badge ở mọi variant |
| **3. Form primitives** | `Input`/`Textarea`/`Select`/`Field`; nâng `MentoringField/FormError` thành chung (giữ API) | `components/ui/*`, `MentoringUi.tsx` | TB | Form login + 1 form mentoring |
| **4. Overlay & dữ liệu** | `Modal` (+ bottom sheet mobile), `ConfirmModal`, `Toast`, `Tabs`, `Table`, `Pagination`, `SelectDropdown`, `PageHeader` | `components/ui/*` | TB–Cao | Mở/đóng modal, Esc, focus trap, mobile sheet |
| **5. Layout** | `AppShell`, `AdminShell`: nav, bottom-nav, thanh trên, FAB, z-index, spacing, container | `components/layout/*` | TB | 375/768/1024/1440, bàn phím, nav active |
| **6. Feed & bài đăng** | `FeedPage` `PostCard`, `PostDetailPage`, `features/feed`, `features/post`, `features/forum` | theo 7.1–7.2 | TB | Feed dài, mobile một tay, thanh hành động 44px |
| **7. Nhóm, kết nối, hồ sơ, tin nhắn, thông báo, sự kiện, việc làm, bản đồ** | theo 7.2–7.5 (chia nhỏ theo từng feature, mỗi feature một lần duyệt) | `features/*`, `pages/app/*` | TB | Từng feature |
| **8. Mentoring** | theo 7.6, chia theo luồng (Tìm mentor · Yêu cầu · Task · Deal/Tranh chấp · Ví/Thanh toán · Nhóm) | `features/mentorship/*`, `pages/app/Mentor*`/`Mentoring*` | TB–Cao (tiền) | Từng luồng; **không đổi điều kiện hiện nút** |
| **9. Admin** | theo 7.7 (Bảng → Bộ lọc → Modal) | `features/admin/*` | TB | Từng trang admin |
| **10. Auth/404/Landing** | theo 7.8 | `pages/auth/*`, `NotFoundPage`, `SubscriptionPage` | Thấp | — |
| **11. Dọn dẹp** | mục 10; xóa token/CSS cũ, grep về 0 | `index.css`, toàn bộ | Thấp | Số liệu mục tiêu |

**Cổng sau MỖI bước (cả AI lẫn người duyệt):**
1. `npm run build` + type-check sạch, không thêm cảnh báo mới.
2. `git diff --stat` + liệt kê file đã đổi; xác nhận không đụng logic (checklist mục 0).
3. Light và dark; 375 / 768 / 1024 / 1440; không cuộn ngang.
4. Tương phản, focus, bàn phím, reduced-motion.
5. Báo cáo ngắn: đã đổi gì, còn gì chưa làm, rủi ro/điểm nghi ngờ (bao gồm lỗi logic tình cờ phát hiện — chỉ báo, không sửa).
6. **Dừng, chờ chủ dự án duyệt** rồi mới sang bước kế.

### Mục tiêu đo được khi hoàn tất
| Chỉ số | Hiện tại | Mục tiêu |
|---|---|---|
| `dark:*-[#hex]` | ~1.992 | 0 |
| Hex trong `.tsx` | ~2.524 | 0 (chỉ còn trong file token) |
| Chữ <12px (`text-[9/10/11px]`) | ~564 | 0 |
| Modal tự viết (`fixed inset-0`) | 51 file | 0 (ngoại lệ có lý do được ghi) |
| Mức bo góc | 7 | 4 |
| Mức bóng | ~10 | 3 |
| z-index tùy ý (`z-[N]`) | ~29 | 0 |
| Bộ tone trạng thái | 2 bộ (9 + 6) | 1 bộ (6) |
| Component `Input` chung | 0 | 1 (dùng cho phần lớn 235 control) |
| Nút icon <44px | ~200+ | 0 |

---

## 13. Điểm cần chủ dự án quyết định (trước khi bắt đầu bước 1)

1. **Màu nút primary (tương phản):** chữ trắng trên cam `#F27024` chỉ đạt ~2,95:1. Chọn: **A (khuyến nghị)** nền nút `#C2410C` (sẫm hơn một chút, đạt 5,2:1), cam thương hiệu giữ cho icon/viền/focus; **B** giữ nền cam, đổi chữ nút sang đậm tối; **C** giữ nguyên như hiện tại (chấp nhận không đạt WCAG AA).
2. **Hướng thiết kế “Warm & Clean Community”** (nền sạch, card phẳng) có đúng ý không? Hay muốn nhiều màu/trẻ trung hơn?
3. **Chữ nội dung bài đăng lên 16px** (từ 14px) và mọi chữ ≥12px: đồng ý? (Một số khu dày như bảng/badge phải chỉnh lại bố cục.)
4. **Bỏ `uppercase` mặc định của Badge** (khó đọc tiếng Việt) và đổi tên tone — đồng ý?
5. **`TiltCard`/spotlight** ở danh sách người dùng: bỏ hiệu ứng nghiêng, thay hover nâng nhẹ?
6. **Dấu xác minh (`verified`)** của `Avatar`: prop có nhưng chưa hiển thị — có muốn hiển thị không (đây là thay đổi hiển thị, cần bạn duyệt)?
7. **Bottom sheet trên mobile** cho mọi modal: đồng ý?
8. **Thứ tự bắt đầu:** làm theo kế hoạch 1→11, hay thử trước trên màn **Feed (`PostCard`)** để duyệt cảm giác rồi mới áp dụng rộng?

---

## 14. Nhật ký khảo sát & giả định
- Số liệu lấy bằng grep tại thời điểm nhánh `feature/group-mentorship`; sẽ lệch nhẹ khi code đổi.
- Chưa mở ứng dụng thật để chụp ảnh các màn hình; đánh giá thị giác dựa trên code. **Bước 0 (ảnh mốc) cần làm khi bắt đầu.**
- Tương phản tính bằng công thức WCAG; cần xác nhận lại bằng công cụ khi triển khai bước 1–2.
- Danh sách trang trong `pages/` (44 file) và `features/` (19 module) đã đếm; chi tiết từng màn hình trong 7.x là **mẫu bố cục chuẩn**, khi làm từng màn sẽ đọc file thực tế để áp dụng.
- 21st.dev MCP: chỉ dùng để tham khảo bố cục (không cài component). Lượt `get_component` (có phí/quota) chưa dùng.

---

## 15. Quyết định đã chốt & nhật ký tiến độ

### 15.1 Quyết định (chủ dự án ủy quyền “làm theo ý bạn sao cho phù hợp”)
1. **Nút primary:** phương án **A** — nền `--c-primary-solid` `#C2410C` (chữ trắng ≈ 5,2:1). Cam `#F27024` giữ cho icon, viền, focus, nền nhẹ, logo, chữ lớn. *Áp dụng ở Bước 2, không phải Bước 1.*
2. Hướng **“Warm & Clean Community”**.
3. Chữ nội dung bài đăng **16px**; mọi chữ ≥12px.
4. Badge **bỏ `uppercase` mặc định**; hợp nhất tone về 6 giá trị (có alias).
5. **Bỏ hiệu ứng nghiêng/spotlight** của `TiltCard` ở danh sách người dùng, thay hover nâng nhẹ.
6. **`verified` của Avatar:** KHÔNG tự thêm hiển thị (là thay đổi chức năng hiển thị) — để chủ dự án quyết riêng.
7. **Bottom sheet mobile** cho modal.
8. Thứ tự: làm theo 1→11; **sau Bước 2 sẽ làm thử `PostCard` (Bước 6) sớm để duyệt cảm giác** nếu chủ dự án muốn đảo thứ tự.

### 15.2 Điều chỉnh kỹ thuật so với mục 2.1 (phát hiện khi triển khai)
- **Bo góc:** KHÔNG ghi đè `--radius-sm/md/lg` của Tailwind ở Bước 1, vì sẽ làm đổi hình toàn app (đang có 94–777 chỗ dùng `rounded-md/lg/xl`). Việc quy bo góc về 4 mức làm **theo từng component ở các bước sau** bằng class tường minh, và chỉ xóa/ghi đè token cũ ở Bước 11.
- **Bóng:** token cũ `--shadow-card`/`--shadow-soft` giữ nguyên; thêm mới `--shadow-raised`, `--shadow-overlay` (biến thô `--c-shadow-*`).
- Tên token mới **không trùng** tên token cũ, nên không thay đổi bất kỳ giao diện nào hiện có.

### 15.3 Nhật ký
| Bước | Trạng thái | Ghi chú |
|---|---|---|
| 0 | Xong | Nhánh `feature/ui-redesign`. Ảnh chụp bằng Playwright với tài khoản test `ui.test.{student,alumni,admin}@example.com` (DB dev). |
| 1. Tokens | Xong (đã duyệt) | Khối token trong `src/index.css`. |
| 2. Button/Badge/Card/Avatar | Xong (đã duyệt) | `buttonStyles.ts`, `primitives.tsx` dùng token. |
| 3. Form | Xong (đã duyệt) | `components/ui/Input.tsx` (Input/Textarea/Select/FormField). |
| 4. Overlay | Xong | Modal/ConfirmModal thành bottom sheet trên mobile, nút đóng 44px; Toast dùng token. `Button` bọc children bằng `inline-flex` (preflight làm `svg` thành block → icon bị rớt dòng). Badge `whitespace-nowrap`. |
| 5. Shell | Xong | Bottom nav pill active, safe-area; sheet "Thêm" token. Codemod `tokenize.py` (~225 file, chỉ className). |
| 6. Feed | Xong | Thanh hành động 3 ô bằng nhau cao 44px (nhãn ẩn dưới `sm`, vẫn có cho screen reader), Lưu/Báo cáo 44px; nội dung 16px; khối tuyển dụng/sự kiện phẳng; badge thành tựu bỏ uppercase; composer/tab lọc không rớt dòng trên mobile. |
| 7. Trang app | Xong | Codemod `sem.py`: amber/emerald/rose/sky → token warning/success/danger/info (bỏ qua chuỗi có gradient/nền đặc sáng). Plum mờ → surface/border. Gradient cam→tím → `primary-solid`. Tab Profile/Forum/Events cuộn ngang. |
| 8. Mentoring | Xong | Modal điều khoản thành bottom sheet trên mobile, token hóa. |
| 9. Admin | Xong | Gradient gold/brand/rose/emerald → token; chip loại bài viết đọc được ở dark; bảng `min-w` + cuộn ngang; **thêm dải điều hướng cuộn ngang + nút đăng xuất trên mobile** (dùng lại `ADMIN_NAV` và `useLogout`, trước đó admin không điều hướng được trên mobile). |
| 10. Auth/404 | Xong (kiểm tra) | Đã token hóa qua codemod; light/dark/mobile ổn. |
| 11. Dọn dẹp | Xong (phần an toàn) | 425 class `dark:*-[#hex]` → `dark:*-token`; hex thương hiệu còn sót (cam, xanh Logo/Jobs) → token; gradient cam→amber ở nút → `primary-solid`; `mint/coral/gold/violet/cream` → token trạng thái/neutral qua codemod `sem.py`/`tokenize.py`. Chỉ đổi className (đã kiểm tra diff). **Cố ý giữ lại:** định nghĩa thang `plum/brand/cream/...` trong `index.css` vì còn ~700 chỗ dùng (chủ yếu `plum-900/brand-*` trong admin/thẻ đặc); hex trong giao diện nền tối cố định (ImageViewer, embed kiểu Discord, bubble chat, gradient logo AppShell). Xóa hẳn thang cũ cần một đợt riêng. |
| 12. Rà soát luồng Mentoring | Xong | Seed dữ liệu dev (tag `DEV-SEED`, chèn thẳng DB, không qua PayOS) cho Student/Mentor/Admin; đi qua các màn Deal, Task, chat, tranh chấp, hoàn tiền, thu nhập, gói dịch vụ, bảng xếp hạng, admin ticket/sổ quỹ/cố vấn (light/dark, desktop/mobile). Sửa: định nghĩa `text-2xs/3xs` bị thiếu, bảng ticket admin (cột thao tác không tràn), modal giải quyết ticket, thẻ thành viên Task, thẻ tổng quan sổ quỹ, chip lĩnh vực mentor ở dark, khoảng cách trang Nhóm Mentoring. Chỉ đổi className/bố cục. |

---

## 16. Tham khảo 21st.dev (chỉ lấy ý tưởng bố cục, KHÔNG cài component)

| Loại | Ý tưởng lấy | Áp dụng ở bước |
|---|---|---|
| Table | Khung bo tròn 1 viền, header muted, hàng cao thoáng (~52px), badge trạng thái dạng pill soft, nút `…` cuối hàng, footer "Showing x–y of z" + pagination ô vuông (trang hiện tại đậm). Mobile: chuyển hàng thành card xếp dọc | Step 4 (Table, Pagination) |
| Form field | Label trên, dấu `*` màu danger, viền input đổi sang `danger` + thông báo lỗi ngay dưới (text-sm, màu danger). Input bo `md`, cao ≥44px | Step 3 (Input/Field) |
| Bottom nav (mobile) | Thanh nổi bo tròn, mục đang chọn mở rộng thành pill có icon + nhãn, mục còn lại chỉ icon | Step 5 (AppShell bottom nav) |
| Stat tile | Card viền mảnh: nhãn muted nhỏ + icon góc phải, số lớn đậm, dòng delta xanh (tăng)/đỏ (giảm) | Step 4/9 (StatTile dùng chung) |
| Empty state | Icon trong ô nhỏ có viền/bóng, tiêu đề đậm, mô tả muted 2 dòng, 1 nút hành động bên dưới, căn giữa | Step 2 (EmptyState) |
| User item | Hàng: avatar bo vuông mềm + tên + mô tả muted (nghề · nơi) + 1 nút hành động bên phải; không tilt/spotlight | Step 7 |
| Modal | Mobile = bottom sheet, header/footer cố định, phần thân cuộn | Step 4 (Modal) |

Ghi chú: 21st chỉ dùng để tham khảo; mọi thứ viết lại bằng token `--c-*` và component dùng chung của dự án, không đổi logic/props.
