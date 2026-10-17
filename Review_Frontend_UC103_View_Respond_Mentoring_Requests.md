# BÁO CÁO REVIEW FRONTEND — UC103: XEM VÀ PHẢN HỒI YÊU CẦU MENTORING (VIEW & RESPOND TO MENTORING REQUESTS)

## 1. TỔNG QUAN TRIỂN KHAI (IMPLEMENTATION SUMMARY)

- **Mã Use Case:** UC103
- **Tên tính năng:** Xem và phản hồi yêu cầu Mentoring (View & Respond to Mentoring Requests)
- **Module:** Mentorship
- **Actor chính:** Mentor (Alumni có Mentor Profile)
- **Công nghệ áp dụng:** React 18+, TypeScript, Vite, Tailwind CSS, TanStack Query (React Query) v5, Lucide React, Framer Motion

### Danh sách các tệp tin Frontend đã tạo mới và chỉnh sửa

| STT | Loại tệp | Đường dẫn tệp tin | Vai trò / Mô tả |
| :--- | :--- | :--- | :--- |
| 1 | **Types Update** | `alumnect-frontend/src/features/mentorship/model/mentoringRequestTypes.ts` | Bổ sung `MentorIncomingRequestData`, `MentorIncomingRequestDetailData`, `RespondMentoringRequestPayload`. |
| 2 | **API Client Update** | `alumnect-frontend/src/features/mentorship/api/mentoringRequestApi.ts` | Bổ sung 4 phương thức gọi API: `getIncomingRequests`, `getIncomingRequestDetail`, `acceptIncomingRequest`, `declineIncomingRequest`. |
| 3 | **Custom Hook Mới** | `alumnect-frontend/src/features/mentorship/hooks/useIncomingMentoringRequests.ts` | React Query hook lấy danh sách incoming requests hỗ trợ phân trang và lọc theo `status`, `requestType`. |
| 4 | **Custom Hook Mới** | `alumnect-frontend/src/features/mentorship/hooks/useIncomingMentoringRequestDetail.ts` | React Query hook lấy chi tiết incoming request theo `requestId`. |
| 5 | **Custom Hook Mới** | `alumnect-frontend/src/features/mentorship/hooks/useRespondIncomingRequest.ts` | React Query mutation hooks cho `useAcceptIncomingRequest` và `useDeclineIncomingRequest`, tự động làm mới cache liên quan (`incoming-requests`, `detail`, `requests`). |
| 6 | **Component Mới** | `alumnect-frontend/src/features/mentorship/components/IncomingRequestCard.tsx` | Thẻ hiển thị tóm tắt một yêu cầu gửi đến cho Mentor kèm avatar sinh viên, thông số yêu cầu, trạng thái phản hồi và nút điều hướng xem chi tiết. |
| 7 | **Component Mới** | `alumnect-frontend/src/features/mentorship/components/IncomingRequestResponseModal.tsx` | Modal dialog xác nhận phản hồi (Chấp nhận hoặc Từ chối), tiếp nhận ghi chú phản hồi tùy chọn và hiển thị lưu ý nghiệp vụ ACCEPTED ≠ Deal. |
| 8 | **Trang Mới** | `alumnect-frontend/src/pages/app/IncomingMentoringRequestsPage.tsx` | Trang danh sách yêu cầu gửi đến cho Mentor kèm bộ lọc kép (Trạng thái phản hồi & Loại yêu cầu), Skeleton loading, Empty state và Phân trang. |
| 9 | **Trang Mới** | `alumnect-frontend/src/pages/app/IncomingMentoringRequestDetailPage.tsx` | Trang chi tiết yêu cầu gửi đến kèm thông tin sinh viên, nội dung yêu cầu, file đính kèm, cờ phản hồi và CTA nhắn tin trao đổi UC104. |
| 10 | **Navigation Update** | `alumnect-frontend/src/features/mentorship/constants/mentorshipNavigation.ts` | Cập nhật mục "Quản lý yêu cầu hướng dẫn" (đang planned) thành mục thực tế "Yêu cầu gửi đến", đường dẫn `/app/mentoring/incoming-requests`, icon `Inbox`. |
| 11 | **Router Update** | `alumnect-frontend/src/App.tsx` | Đăng ký các route `/app/mentoring/incoming-requests` và `/app/mentoring/incoming-requests/:id` (bảo vệ bởi `ProtectedRoute`), kèm các alias tương thích. |
| 12 | **Barrel Export** | `alumnect-frontend/src/features/mentorship/index.ts` | Xuất khẩu toàn bộ hooks và components của UC103 để các tầng khác sử dụng thuận tiện. |

---

## 2. THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX)

1. **Tuân thủ Pastel Premium Design System:**
   - Gam màu chủ đạo kem ấm (`bg-cream-50`, `bg-cream-100/80`), viền thanh thoát `plum-900/[0.08]`, chữ đậm `plum-900`, chữ phụ `plum-600`, và gradient tím thương hiệu `brand-600`.
   - Bo góc mềm mại `rounded-2xl` và `rounded-3xl` mang lại cảm giác hiện đại và cao cấp.
2. **Nhắc nhở nghiệp vụ trực quan (Rule 4: ACCEPTED ≠ Deal):**
   - Đặt banner màu hổ phách ngay đầu trang danh sách và đầu modal xác nhận:
     > *"Lưu ý: Bấm Đồng ý trao đổi chỉ xác nhận mở kênh thảo luận qua tin nhắn với sinh viên, KHÔNG tự động tạo thỏa thuận (Deal) hay cam kết thanh toán."*
3. **Bộ lọc linh hoạt (Dual Filters):**
   - Lọc theo Trạng thái phản hồi: Tất cả, Chờ phản hồi (Waiting), Đã đồng ý (Accepted), Đã từ chối (Declined).
   - Lọc theo Loại yêu cầu: Tất cả, Yêu cầu chung (General - UC100), Yêu cầu trực tiếp (Direct - UC101).
4. **Đầy đủ 5 trạng thái giao diện chuẩn mực:**
   - **Loading State:** Hiển thị 4 Skeleton cards với hiệu ứng shimmer mượt mà.
   - **Empty State:** `EmptyState` với icon `Inbox`, giải thích lý do danh sách rỗng và nhắc nhở duy trì trạng thái Mentor ACTIVE.
   - **Error State:** Banner báo lỗi màu hoa hồng kèm nút "Thử lại" gọi hàm `refetch()`.
   - **Forbidden / Unauthorized State:** Card từ chối quyền truy cập khi yêu cầu không thuộc danh sách phân phối của Mentor.
   - **Success / Active State:** Render danh sách yêu cầu và chi tiết đầy đủ thông tin.
5. **Entry point kết nối UC104 (Trao đổi qua tin nhắn):**
   - Khi Mentor ở trạng thái `ACCEPTED`, màn hình hiển thị nút CTA rõ nét: *"Nhắn tin trao đổi với sinh viên"*, điều hướng trực tiếp sang module tin nhắn `/app/messages?userId=${studentId}`.

---

## 3. KẾT QUẢ KIỂM TRA BUILD & TYPE CHECK (FRONTEND VERIFICATION)

Đã chạy lệnh build thực tế trên toàn bộ dự án `alumnect-frontend`:
`npm run build` (`tsc -b && vite build`)

### Kết quả chi tiết:
```
vite v8.0.16 building client environment for production...
transforming...✓ 8088 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                   2.03 kB │ gzip:   0.80 kB
dist/assets/fpt-university-logo-DZLaRiM3.png     46.11 kB
dist/assets/login-bg-cVjEy9nu.jpg               373.98 kB
dist/assets/vendor-libs-Dbp14WPd.css            161.22 kB │ gzip:  22.44 kB
dist/assets/index-B5Rj_pKO.css                  316.19 kB │ gzip:  39.07 kB
dist/assets/rolldown-runtime-CMxvf4Kt.js          1.21 kB │ gzip:   0.67 kB
dist/assets/vendor-query-DCNX-8R3.js              2.85 kB │ gzip:   1.31 kB
dist/assets/vendor-router-D0Qdxdxb.js            42.76 kB │ gzip:  15.30 kB
dist/assets/vendor-zod-CmVPwEg5.js               70.57 kB │ gzip:  18.87 kB
dist/assets/vendor-motion-RKaM1f1Q.js           134.81 kB │ gzip:  44.18 kB
dist/assets/vendor-icons-Ci-FbIhP.js            141.79 kB │ gzip:  38.89 kB
dist/assets/vendor-react-Cy1SwDX9.js            174.83 kB │ gzip:  55.09 kB
dist/assets/index-Dx-FD45f.js                 1,324.30 kB │ gzip: 282.27 kB
dist/assets/vendor-libs-BD7Cf-c1.js           1,555.28 kB │ gzip: 425.66 kB

✓ built in 2.04s
```

**Kết luận:** Quá trình biên dịch TypeScript và đóng gói Vite hoàn tất sạch sẽ, **0 lỗi, 0 cảnh báo TypeScript**.
