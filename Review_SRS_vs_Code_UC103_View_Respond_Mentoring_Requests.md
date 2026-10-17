# BÁO CÁO REVIEW SRS VS CODE — UC103: XEM VÀ PHẢN HỒI YÊU CẦU MENTORING (VIEW & RESPOND TO MENTORING REQUESTS)

## 1. TỔNG QUAN ĐỐI CHIẾU (CONSISTENCY ASSESSMENT)

- **Mã Use Case:** UC103
- **Tên tính năng:** Xem và phản hồi yêu cầu Mentoring (View & Respond to Mentoring Requests)
- **Tài liệu đặc tả đối chiếu:** `docs/update_SRS/SRS_UC103_View_Respond_Mentoring_Requests.md`
- **Mã nguồn Backend:** `alumnect-backend`
- **Mã nguồn Frontend:** `alumnect-frontend`

### Bảng đánh giá độ nhất quán tổng thể

| Hạng mục kiểm tra | Trọng số | Tỷ lệ khớp (%) | Đánh giá |
| :--- | :--- | :--- | :--- |
| **Nghiệp vụ cốt lõi & Luồng xử lý (Business Workflow)** | 25% | 100% | Khớp hoàn toàn. Mentor xem danh sách incoming requests, xem chi tiết, và phản hồi ACCEPT/DECLINE. Phân phối chuẩn xác General vs Direct Request. |
| **Quy tắc Nghiệp vụ (Business Rules BR-103-01 -> BR-103-10)** | 25% | 100% | Đã triển khai và có 13 unit tests kiểm thử độc lập bao phủ 100% các BR (ACTIVE, Subscription, OPEN status, Idempotent...). |
| **Mô hình Dữ liệu, Entity & Database Consistency** | 15% | 100% | Tái sử dụng trọn vẹn `mentoring_requests` và `mentoring_request_distributions` (đã có sẵn `response_note` từ V20). Không can thiệp migration cũ. |
| **API Endpoints, DTO & Bảo mật Phân quyền** | 15% | 100% | Khớp API GET và POST, trích xuất danh tính Mentor từ JWT, kiểm tra ownership 403 Forbidden nếu không thuộc danh sách phân phối. |
| **Giao diện Người dùng, Component & Trạng thái UI** | 10% | 100% | Khớp đầy đủ 5 trạng thái UI (Loading Skeleton, Empty State, Not Found 404, Access Denied 403, Success). Tích hợp module tin nhắn sẵn có khi ACCEPTED. |
| **Ranh giới nghiệp vụ: ACCEPTED ≠ Deal (Rule 4)** | 10% | 100% | Tuân thủ tuyệt đối: Mentor ACCEPTED chỉ mở kênh trao đổi tin nhắn, tuyệt đối KHÔNG tự tạo Deal, KHÔNG kích hoạt thanh toán, KHÔNG đóng request. |
| **ĐIỂM NHẤT QUÁN TỔNG THỂ** | **100%** | **100%** | **HOÀN HẢO (PERFECT ALIGNMENT)** |

---

## 2. BẢNG KIỂM TRA CHI TIẾT TỪNG THÀNH PHẦN (DETAILED CHECKLIST)

### 2.1. Đối chiếu Quy tắc Nghiệp vụ (Business Rules)

| Mã BR | Quy tắc Nghiệp vụ trong SRS | Triển khai trong Code Backend | Triển khai trong Code Frontend | Kết quả |
| :--- | :--- | :--- | :--- | :--- |
| **BR-103-01** | **Ownership & Isolation**: Mentor chỉ xem và phản hồi request được phân phối cho mình | Kiểm tra `distribution.mentorProfile.id == currentMentorProfileId` -> ném `AccessDeniedException` (HTTP 403) nếu vi phạm | Xử lý lỗi 403 hiển thị card cảnh báo bảo mật, không để lộ dữ liệu | **KHỚP 100%** |
| **BR-103-02** | **Direct Request Exclusivity**: Direct Request chỉ gửi cho 1 Mentor đích | Query theo `d.mentorProfile.id = :mentorProfileId` -> Mentor khác không bao giờ lấy được bản ghi | Hiển thị badge "Trực tiếp (UC101)", chỉ Mentor đích thấy trong Incoming Requests | **KHỚP 100%** |
| **BR-103-03** | **General Request Non-exclusive**: Một Mentor ACCEPTED không đóng request với Mentor khác | Không thay đổi `request.setStatus(...)` khi Mentor phản hồi; request vẫn ở trạng thái OPEN | Các Mentor khác vẫn thấy cờ `canRespond = true` nếu request còn OPEN | **KHỚP 100%** |
| **BR-103-04** | **ACCEPTED ≠ Deal**: Chấp nhận yêu cầu không tạo Deal | Không gọi deal/session/payment service; chỉ cập nhật `distribution.status = ACCEPTED` | Hiển thị thông báo lưu ý và chỉ cung cấp CTA "Nhắn tin cho sinh viên" | **KHỚP 100%** |
| **BR-103-05** | **Mentor Eligibility**: Mentor phải ACTIVE & Subscription còn hạn | Kiểm tra `mentorProfile.status == ACTIVE` và `subscriptionRepository.findActiveSubscription(...)` -> ném 403 nếu vi phạm | Kiểm tra cờ `canRespond`, nếu không đủ điều kiện sẽ khóa nút phản hồi và hiển thị banner cảnh báo | **KHỚP 100%** |
| **BR-103-06** | **Request Availability**: Request phải ở trạng thái OPEN | Kiểm tra `request.status == OPEN` -> ném `BadRequestException` (HTTP 400) nếu đã closed/cancelled | Ẩn nút phản hồi nếu `canRespond = false` | **KHỚP 100%** |
| **BR-103-07** | **Idempotency & No Duplicate**: Không phản hồi lần 2 | Kiểm tra `distribution.status == PENDING` -> ném `ConflictException` (HTTP 409) nếu đã phản hồi | Sau khi phản hồi thành công, UI chuyển sang hiển thị banner trạng thái đã ghi nhận | **KHỚP 100%** |
| **BR-103-08** | **Atomic Update**: Đảm bảo toàn vẹn giao dịch | Phương thức `acceptIncomingRequest` và `declineIncomingRequest` được gắn `@Transactional` | Mutation React Query disable nút khi đang submit tránh double submit | **KHỚP 100%** |
| **BR-103-09** | **Response Note Validation**: Ghi chú tối đa 500 ký tự | Bean Validation `@Size(max = 500)` trong `RespondMentoringRequestRequest` | Modal có `maxLength={500}` kèm bộ đếm ký tự trực quan | **KHỚP 100%** |
| **BR-103-10** | **UC102 Synchronization**: Đồng bộ phản hồi sang sinh viên | Lưu trực tiếp vào `mentoring_request_distributions` -> UC102 truy vấn bảng này thấy ngay | Sinh viên xem My Requests / Request Detail thấy trạng thái mới tức thì | **KHỚP 100%** |

---

## 3. ĐỐI CHIẾU THIẾT KẾ LỚP & DATABASE SCHEMA

| Thành phần thiết kế | Định nghĩa trong SRS | Mã nguồn thực tế | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Entity Phân phối** | `MentoringRequestDistribution` | `entity/mentorship/MentoringRequestDistribution.java` | Khớp 100% |
| **Repository Phân phối** | `MentoringRequestDistributionRepository` (`findByRequestIdAndMentorProfileId`, `findIncomingRequests`) | `dao/mentorship/MentoringRequestDistributionRepository.java` | Khớp 100% |
| **Request DTO** | `RespondMentoringRequestRequest` (`responseNote`) | `dto/request/mentorship/RespondMentoringRequestRequest.java` | Khớp 100% |
| **Response DTO List** | `MentorIncomingRequestResponse` | `dto/response/mentorship/MentorIncomingRequestResponse.java` | Khớp 100% |
| **Response DTO Detail** | `MentorIncomingRequestDetailResponse` | `dto/response/mentorship/MentorIncomingRequestDetailResponse.java` | Khớp 100% |
| **Service Interface** | `MentoringRequestService` (`getIncomingRequests`, `getIncomingRequestDetail`, `acceptIncomingRequest`, `declineIncomingRequest`) | `service/mentorship/MentoringRequestService.java` | Khớp 100% |
| **Service Impl** | `MentoringRequestServiceImpl` | `service/mentorship/MentoringRequestServiceImpl.java` | Khớp 100% |
| **Controller** | `MentoringRequestController` (`/incoming`, `/incoming/{id}`, `/{id}/accept`, `/{id}/decline`) | `controller/mentorship/MentoringRequestController.java` | Khớp 100% |
| **Pages UI** | `IncomingMentoringRequestsPage` & `IncomingMentoringRequestDetailPage` | `src/pages/app/` | Khớp 100% |
| **Components UI** | `IncomingRequestCard`, `IncomingRequestResponseModal` | `src/features/mentorship/components/` | Khớp 100% |
| **Navigation Sidebar** | `mentorshipNavigation.ts` (mục Yêu cầu gửi đến, icon Inbox) | `src/features/mentorship/constants/mentorshipNavigation.ts` | Khớp 100% |

---

## 4. ĐỐI CHIẾU TEST CASES (TEST EXECUTION MAPPING)

| Mã Test Case | Mục tiêu kiểm thử | Unit Test tương ứng trong `MentorIncomingRequestsServiceTest` | Kết quả |
| :--- | :--- | :--- | :--- |
| **TC103-01** | Xem danh sách General Requests được phân phối | `test01_GetIncomingRequests_Success()` | **PASS** |
| **TC103-02** | Xem Direct Request gửi riêng cho Mentor | `test02_GetIncomingRequests_FilterByDirectType()` | **PASS** |
| **TC103-03** | Xem chi tiết Incoming Request hợp lệ | `test03_GetIncomingRequestDetail_Success()` | **PASS** |
| **TC103-04** | Mentor không được phân phối xem chi tiết bị từ chối (403) | `test04_GetIncomingRequestDetail_NotAssignedToMentor_ThrowsAccessDenied()` | **PASS** |
| **TC103-05** | Accept yêu cầu thành công, không tạo Deal | `test05_AcceptIncomingRequest_Success_DoesNotCreateDeal()` | **PASS** |
| **TC103-06** | Decline yêu cầu thành công | `test06_DeclineIncomingRequest_Success()` | **PASS** |
| **TC103-07** | Mentor không ACTIVE bị từ chối phản hồi (403) | `test07_AcceptIncomingRequest_MentorNotActive_ThrowsAccessDenied()` | **PASS** |
| **TC103-08** | Mentor Subscription hết hạn bị từ chối phản hồi (403) | `test08_AcceptIncomingRequest_SubscriptionExpired_ThrowsAccessDenied()` | **PASS** |
| **TC103-09** | Yêu cầu đã đóng bị từ chối phản hồi (400) | `test09_AcceptIncomingRequest_RequestNotOpen_ThrowsBadRequest()` | **PASS** |
| **TC103-10** | Ngăn chặn phản hồi lần 2 khi đã ACCEPTED (409) | `test10_AcceptIncomingRequest_AlreadyAccepted_ThrowsConflict()` | **PASS** |
| **TC103-11** | Ngăn chặn phản hồi lần 2 khi đã DECLINED (409) | `test11_DeclineIncomingRequest_AlreadyDeclined_ThrowsConflict()` | **PASS** |
| **TC103-12** | General Request nhiều Mentor phản hồi độc lập | `test12_GeneralRequest_MultipleMentors_IndependentResponses()` | **PASS** |
| **TC103-13** | Người dùng chưa có hồ sơ Mentor bị từ chối (404/403) | `test13_GetIncomingRequests_NoMentorProfile_ThrowsNotFound()` | **PASS** |

---

## 5. KẾT LUẬN & ĐÁNH GIÁ TỔNG THỂ

1. **Tính tương thích & Không hồi quy (Zero Regression):**
   - UC100 (Tạo yêu cầu chung) và UC101 (Gửi yêu cầu trực tiếp) tiếp tục hoạt động hoàn hảo, lưu trữ dữ liệu phân phối theo đúng cấu trúc hiện tại.
   - UC102 (Sinh viên xem phản hồi) được đồng bộ dữ liệu tức thì khi Mentor ACCEPT/DECLINE từ UC103 mà không cần can thiệp bất kỳ dòng code nào.
2. **Tuân thủ quy chuẩn chất lượng:**
   - Backend: Biên dịch sạch sẽ, 13/13 Unit Tests PASS.
   - Frontend: TypeScript check & Vite build PASS (0 lỗi, 0 cảnh báo).
   - Thiết kế giao diện: Chuẩn mực Pastel Premium Design System của AlumNect.
   - Tài liệu đặc tả: Cung cấp đầy đủ SRS theo chuẩn `TemplateSRS.md`.
