---
name: mentoring-ux-rearrange
description: Sắp xếp lại UX các luồng Mentoring (nút quay lại, liên kết giữa trang, khối "Việc cần làm tiếp", thanh tiến trình, nhãn trạng thái) mà TUYỆT ĐỐI không làm mất chức năng hay gây lỗi. Dùng mỗi khi sửa bất kỳ trang/component nào thuộc Mentoring hoặc Admin Mentoring.
---

# Skill: Sắp xếp UX Mentoring (không đổi chức năng)

## Mục tiêu
Chỉ **sắp xếp và nối các trang cho hợp lý** để người dùng đi lại dễ hơn. Mọi chức năng hiện có phải còn nguyên và chạy y như cũ.

## Quy tắc cứng (vi phạm = dừng và hoàn tác)
1. **Không đổi logic**: state, hook, API call, mutation, query key, props/type, điều kiện role/permission, handler, validation.
2. **Không xoá, không ẩn** tính năng, nút hành động, modal hay trường dữ liệu. Chỉ được **di chuyển** hoặc **thêm điều hướng**.
3. **Không đổi route đã có** (đường dẫn, tham số). Route mới chỉ khi thật cần và phải được người dùng duyệt trước.
4. **Không đổi tên/ý nghĩa dữ liệu** trả về từ backend, không sửa backend.
5. **Điều kiện hiển thị giữ nguyên**: một nút chỉ hiện với role/trạng thái nào thì vẫn y như vậy. Khối mới chỉ được **đọc** dữ liệu có sẵn.
6. **Không tự đoán dữ liệu**: nếu một thông tin (giá, số task, độ ưu tiên) không có trong API hiện tại thì **không hiển thị** và báo lại người dùng.
7. Dùng token và component dùng chung (`docs/design-system.md`), không hardcode màu/khoảng cách. Hỗ trợ light/dark và mobile.
8. Mỗi lần chỉ sửa **một nhóm trang nhỏ**, rồi kiểm tra xong mới làm nhóm tiếp.

## Quy trình cho MỖI thay đổi
1. **Đọc trước khi sửa**: mở file, ghi lại (a) các props, (b) các hook và API đang dùng, (c) các nút/hành động hiện có và điều kiện hiện chúng. Sau khi sửa phải đối chiếu lại danh sách này, không thiếu mục nào.
2. **Lập danh sách chức năng của trang** (checklist) từ code, không từ trí nhớ.
3. **Sửa tối thiểu** bằng `Edit`, giữ định dạng dòng (CRLF/LF) của file.
4. **Kiểm tra tự động**: `npx tsc -b --noEmit`, rồi `npm run build` sau mỗi nhóm.
5. **Kiểm tra bằng mắt** bằng Playwright với dữ liệu seed `DEV-SEED` (tài khoản `ui.test.{student,alumni,admin}@example.com`, mật khẩu `Test12345`): chụp light + dark, desktop + mobile; bấm thử nút quay lại và các liên kết mới.
6. **Đối chiếu checklist** ở bước 2: mọi nút và hành động cũ vẫn còn và vẫn đúng điều kiện.
7. Nếu có lỗi hoặc nghi ngờ ảnh hưởng chức năng: **hoàn tác phần đó** (`git diff` để xem, `git checkout -- <file>` chỉ với file mình vừa sửa), báo người dùng, không cố vá.

## Phần việc, theo thứ tự (làm xong từng mục mới sang mục sau)

### A. Nút quay lại và đường dẫn giữa các trang
Nguyên tắc: **quay về trang cha logic**, không dùng `navigate(-1)` khi người dùng có thể vào thẳng bằng link (dùng liên kết cố định tới trang cha; chỉ dùng `-1` khi trang cha có thể khác nhau và đã có tiền lệ).

Dùng một component chung `BackLink` (đặt ở `components/ui`), hiển thị mũi tên + nhãn "Quay lại <tên trang cha>", có vùng bấm ≥44px trên mobile.

| Trang | Quay về |
|---|---|
| Chi tiết mentor `/mentors/:id` | Khám phá Mentor |
| Tạo yêu cầu / gửi yêu cầu trực tiếp | Trang đã mở nó (Khám phá, Chi tiết mentor hoặc Yêu cầu của tôi) |
| Chi tiết yêu cầu (học viên) | Yêu cầu của tôi |
| Chi tiết yêu cầu gửi đến (mentor) | Yêu cầu gửi đến |
| Chi tiết task | Danh sách task |
| Chat của task | **Đã chốt:** vào từ Chi tiết task thì quay về Chi tiết task; vào từ danh sách Tin nhắn thì quay về Tin nhắn (truyền nguồn qua `location.state`, không có state thì mặc định về Tin nhắn) |
| Chi tiết nhóm | Nhóm Mentoring |
| Thỏa thuận / Hoàn tiền / Thu nhập / Trạng thái / Gói dịch vụ | Tổng quan Mentoring |
| Đăng ký làm mentor, Điều khoản | Tổng quan Mentoring |
| Admin: drawer/chi tiết ticket, hồ sơ cố vấn | Danh sách tương ứng |

Trang đã có nút quay lại (TaskDetail, RequestDetail, GroupDetail, IncomingRequestDetail, CreateDirectRequest, Home): **giữ**, chỉ thống nhất giao diện sang `BackLink` nếu hành vi giống hệt.

### Trạng thái mục A (đã làm)
- Đã có `components/ui/BackLink.tsx` (`BackLink`, `useBackNavigation`; thuộc tính `data-back-link` để test). Dùng `smart` cho trang nhiều nguồn vào.
- Đã gắn: Thỏa thuận, Hoàn tiền, Thu nhập, Trạng thái, Gói dịch vụ (ẩn khi đang checkout), Đăng ký mentor, Điều khoản (về Tổng quan); Chi tiết mentor (smart, dự phòng Khám phá); Tạo yêu cầu (smart, dự phòng Yêu cầu của tôi); Chat (mũi tên ở header, smart, dự phòng Tin nhắn).
- Còn lại của mục A: kiểm tra từng trang trong bảng chưa liệt kê ở trên (Admin drawer/hồ sơ cố vấn) và trang chi tiết đã có nút cũ nếu muốn thống nhất giao diện sang `BackLink`.

### B. Liên kết chéo giữa các trang
- **Đã làm (học viên/mentor):** cột Task ở Thu nhập và Hoàn tiền (`MentoringWalletTable`) link sang `/app/mentoring/tasks/:id`; đã bấm thử. Còn lại: Thỏa thuận, Admin.
- Thu nhập, Hoàn tiền: mỗi dòng task link sang `/tasks/:id`.
- Thỏa thuận: link sang yêu cầu gốc và task (nếu đã có).
- Admin ticket ↔ sổ quỹ ↔ task: link hai chiều khi bản ghi có mã task.
- Chỉ dùng `<Link>`/`navigate` tới route **đã tồn tại**.

### C. Nhãn trạng thái dùng chung
- Tạo một file map duy nhất (trạng thái → nhãn + tone). **Không đổi giá trị trạng thái backend**, chỉ đổi cách hiển thị.
- Thay dần từng nơi, mỗi nơi kiểm tra không còn trạng thái nào bị rơi vào nhãn mặc định.

### D. Thanh tiến trình + "Việc cần làm tiếp" (trang task)
- Chỉ **đọc** trạng thái task/deal/payment đã có để suy ra bước hiện tại.
- Nút chính trong khối này **gọi lại đúng handler đã có** (không viết handler mới) và dùng đúng điều kiện role/trạng thái đang có.
- Nếu không suy ra được bước (dữ liệu thiếu): ẩn khối, **không đoán**.

### E. Hàng đợi ở Tổng quan, sắp xếp danh sách, thẻ mentor
- Chỉ làm khi API hiện có đã trả đủ dữ liệu. Thiếu dữ liệu thì dừng và báo người dùng, không thêm API.
- Sắp xếp chỉ là sắp xếp phía giao diện trên dữ liệu đã tải (không đổi tham số gọi API, không đổi phân trang).

### F. Nhóm menu
- Giữ nguyên route và danh sách mục. Chỉ đổi **nhãn tiêu đề nhóm** cho rõ vai ("Với tư cách học viên", "Với tư cách mentor").
- Gộp trang (Gói dịch vụ vào Trạng thái hồ sơ) **chỉ làm khi người dùng đồng ý riêng**, vì đổi route.

## Danh sách kiểm tra cuối mỗi nhóm
- [ ] `tsc` và `build` sạch.
- [ ] Mọi nút/hành động cũ của trang còn nguyên và đúng điều kiện (đối chiếu checklist).
- [ ] Nút quay lại về đúng trang cha, hoạt động khi vào thẳng bằng URL và khi tải lại trang.
- [ ] Liên kết mới không dẫn tới 404 và không lộ dữ liệu sai role.
- [ ] Light, dark, mobile 390px đều ổn, không tràn ngang.
- [ ] Không có file ngoài phạm vi bị sửa (`git status`).
- [ ] Cập nhật nhật ký trong `docs/design-system.md` (mục 15.3).

## Khi nào phải hỏi người dùng
- Cần đổi route, gộp trang, hoặc thêm dữ liệu từ backend.
- Không chắc một nút có thuộc luồng nào.
- Bất kỳ thay đổi nào có thể đổi hành vi, dù nhỏ.
