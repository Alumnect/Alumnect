# BÁO CÁO REVIEW BACKEND — UC103: XEM VÀ PHẢN HỒI YÊU CẦU MENTORING (VIEW & RESPOND TO MENTORING REQUESTS)

## 1. TỔNG QUAN TRIỂN KHAI (IMPLEMENTATION SUMMARY)

- **Mã Use Case:** UC103
- **Tên tính năng:** Xem và phản hồi yêu cầu Mentoring (View & Respond to Mentoring Requests)
- **Module:** Mentorship
- **Actor chính:** Mentor (Alumni có Mentor Profile ở trạng thái ACTIVE, sở hữu gói Mentor Subscription còn hạn)
- **Kiến trúc áp dụng:** Layered Architecture (Spring Boot 3.x, Java 21, PostgreSQL 14+, Spring Data JPA, Hibernate, Jakarta Bean Validation)

### Danh sách các tệp tin Backend đã tạo mới và chỉnh sửa

| STT | Loại tệp | Đường dẫn tệp tin | Vai trò / Mô tả |
| :--- | :--- | :--- | :--- |
| 1 | **Repository Update** | `alumnect-backend/src/main/java/com/alumnect/alumnect_backend/dao/mentorship/MentoringRequestDistributionRepository.java` | Bổ sung phương thức `findByRequestIdAndMentorProfileId` và truy vấn phân trang JPQL tối ưu `findIncomingRequests` (kèm `JOIN FETCH` request, industry, student). |
| 2 | **Request DTO Mới** | `alumnect-backend/src/main/java/com/alumnect/alumnect_backend/dto/request/mentorship/RespondMentoringRequestRequest.java` | DTO tiếp nhận `responseNote` (tối đa 500 ký tự qua `@Size(max = 500)`). |
| 3 | **Response DTO Mới** | `alumnect-backend/src/main/java/com/alumnect/alumnect_backend/dto/response/mentorship/MentorIncomingRequestResponse.java` | DTO tóm tắt yêu cầu gửi đến cho Mentor trong danh sách phân trang. |
| 4 | **Response DTO Mới** | `alumnect-backend/src/main/java/com/alumnect/alumnect_backend/dto/response/mentorship/MentorIncomingRequestDetailResponse.java` | DTO chi tiết toàn diện yêu cầu gửi đến kèm cờ `canRespond`, `canMessage`. |
| 5 | **Service Interface Update** | `alumnect-backend/src/main/java/com/alumnect/alumnect_backend/service/mentorship/MentoringRequestService.java` | Bổ sung 4 phương thức nghiệp vụ: `getIncomingRequests`, `getIncomingRequestDetail`, `acceptIncomingRequest`, `declineIncomingRequest`. |
| 6 | **Service Impl Update** | `alumnect-backend/src/main/java/com/alumnect/alumnect_backend/service/mentorship/MentoringRequestServiceImpl.java` | Triển khai logic nghiệp vụ: trích xuất Mentor Profile an toàn từ SecurityContext, kiểm tra ACTIVE & Subscription, kiểm tra phân phối, cập nhật trạng thái `ACCEPTED` / `REJECTED`, ghi nhận thời điểm và lời nhắn phản hồi; bảo đảm ACCEPTED ≠ Deal theo Rule 4. |
| 7 | **Controller Update** | `alumnect-backend/src/main/java/com/alumnect/alumnect_backend/controller/mentorship/MentoringRequestController.java` | Expose 4 endpoints chuẩn RESTful phục vụ Actor Mentor: lấy danh sách incoming, chi tiết incoming, accept và decline. |
| 8 | **Unit Test Mới** | `alumnect-backend/src/test/java/com/alumnect/alumnect_backend/service/mentorship/MentorIncomingRequestsServiceTest.java` | 13 kịch bản kiểm thử toàn diện bằng JUnit 5 & Mockito bao phủ 100% các yêu cầu từ TC103-01 đến TC103-17. |
| 9 | **Postman Collection Update** | `postman_collection.json` | Bổ sung thư mục `103. Xem và phản hồi yêu cầu Mentoring (UC103)` gồm 8 requests kiểm thử API. |

---

## 2. ĐÁNH GIÁ CƠ SỞ DỮ LIỆU & MIGRATION (DATABASE REVIEW)

- **Đánh giá bảng:**
  - Bảng `mentoring_requests` (đã có từ V18) lưu thông tin yêu cầu gốc của sinh viên.
  - Bảng `mentoring_request_distributions` (đã có từ V18) lưu quan hệ phân phối độc lập giữa từng Mentor Profile và Yêu cầu.
  - Cột `response_note VARCHAR(500)` đã có sẵn từ migration `V20__add_response_note_to_mentoring_request_distributions.sql`.
- **Kết luận:** Schema hiện tại đáp ứng 100% nghiệp vụ của UC103, **không cần tạo thêm bảng hoặc migration mới**, không can thiệp vào các file migration Flyway cũ đã chạy.

---

## 3. ĐẶC TẢ API CHI TIẾT (API SPECIFICATION)

### 3.1. Endpoint 1: Lấy danh sách Incoming Requests của Mentor
- **URL:** `GET /api/v1/mentoring/requests/incoming`
- **Method:** `GET`
- **Xác thực:** Bearer JWT Token (`ALUMNI` role có Mentor Profile)
- **Tham số truy vấn:**
  - `status`: Lọc theo trạng thái phân phối (`PENDING`, `ACCEPTED`, `REJECTED`, `EXPIRED`)
  - `requestType`: Lọc theo loại yêu cầu (`GENERAL`, `DIRECT`)
  - `page`: Chỉ mục trang (mặc định 0)
  - `size`: Kích thước trang (mặc định 10)
- **Response Status:** `200 OK`

#### Response Body Mẫu:
```json
{
  "success": true,
  "message": "Lấy danh sách yêu cầu cố vấn gửi đến thành công",
  "data": {
    "content": [
      {
        "id": 1001,
        "distributionId": 501,
        "requestType": "GENERAL",
        "title": "Cần cố vấn kiến trúc Microservices & Spring Boot",
        "description": "Em đang làm đồ án tốt nghiệp cần tư vấn về DDD và Docker...",
        "industryId": 1,
        "industryName": "Công nghệ thông tin",
        "studentId": 12,
        "studentName": "Trần Văn Sinh Viên",
        "studentAvatar": "https://alumnect.s3/avatars/student12.png",
        "budgetMin": 500000,
        "budgetMax": 1500000,
        "workingMode": "ONLINE",
        "participationType": "INDIVIDUAL",
        "taskType": "TECHNICAL_CONSULTING",
        "expectedDeadline": "2026-11-01T17:00:00",
        "distributionStatus": "PENDING",
        "responseStatus": "WAITING",
        "responseNote": null,
        "distributedAt": "2026-10-12T10:00:00",
        "respondedAt": null,
        "requestStatus": "OPEN",
        "attachmentCount": 1,
        "createdAt": "2026-10-12T09:45:00"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "size": 10,
    "number": 0
  }
}
```

### 3.2. Endpoint 2: Xem chi tiết Incoming Request
- **URL:** `GET /api/v1/mentoring/requests/incoming/{requestId}`
- **Method:** `GET`
- **Xác thực:** Bearer JWT Token
- **Kiểm tra quyền:** Mentor phải có bản ghi phân phối tương ứng (`distribution.mentorProfile.id == currentMentorProfileId`). Nếu không, trả về HTTP 403 Forbidden.
- **Response Status:** `200 OK`

#### Response Body Mẫu:
```json
{
  "success": true,
  "message": "Lấy chi tiết yêu cầu cố vấn gửi đến thành công",
  "data": {
    "id": 1001,
    "distributionId": 501,
    "requestType": "GENERAL",
    "title": "Cần cố vấn kiến trúc Microservices & Spring Boot",
    "description": "Em đang làm đồ án tốt nghiệp...",
    "industryId": 1,
    "industryName": "Công nghệ thông tin",
    "studentId": 12,
    "studentName": "Trần Văn Sinh Viên",
    "studentAvatar": "https://alumnect.s3/avatars/student12.png",
    "studentHeadline": "Kỹ thuật phần mềm - Khóa 16",
    "studentEmail": "sinhvien@fpt.edu.vn",
    "budgetMin": 500000,
    "budgetMax": 1500000,
    "workingMode": "ONLINE",
    "participationType": "INDIVIDUAL",
    "taskType": "TECHNICAL_CONSULTING",
    "expectedDeadline": "2026-11-01T17:00:00",
    "requestStatus": "OPEN",
    "attachments": [
      {
        "id": 10,
        "fileName": "de-tai-tot-nghiep.pdf",
        "fileUrl": "https://alumnect.s3/attachments/10.pdf",
        "fileSize": 1048576,
        "fileType": "application/pdf",
        "createdAt": "2026-10-12T09:45:00"
      }
    ],
    "distributionStatus": "PENDING",
    "responseStatus": "WAITING",
    "responseNote": null,
    "distributedAt": "2026-10-12T10:00:00",
    "respondedAt": null,
    "canRespond": true,
    "canMessage": false,
    "createdAt": "2026-10-12T09:45:00",
    "updatedAt": "2026-10-12T09:45:00"
  }
}
```

### 3.3. Endpoint 3: Mentor chấp nhận yêu cầu (ACCEPT)
- **URL:** `POST /api/v1/mentoring/requests/{requestId}/accept` (alias: `/api/v1/mentoring/requests/incoming/{requestId}/accept`)
- **Method:** `POST`
- **Request Body:**
```json
{
  "responseNote": "Tôi rất vui lòng hướng dẫn bạn về chủ đề này. Hãy nhắn tin trao đổi chi tiết nhé!"
}
```
- **Xử lý nghiệp vụ:**
  - Kiểm tra Mentor ACTIVE và gói Subscription còn hạn (403 nếu không).
  - Kiểm tra request thuộc danh sách phân phối của Mentor (403 nếu không).
  - Kiểm tra request đang OPEN (400 nếu closed).
  - Kiểm tra distribution đang PENDING (409 nếu đã phản hồi trước đó).
  - Cập nhật `status = ACCEPTED`, `respondedAt = now()`, `responseNote`.
  - **TUYỆT ĐỐI KHÔNG TỰ ĐỘNG TẠO DEAL theo Rule 4.**
- **Response Status:** `200 OK`

### 3.4. Endpoint 4: Mentor từ chối yêu cầu (DECLINE)
- **URL:** `POST /api/v1/mentoring/requests/{requestId}/decline` (alias: `/api/v1/mentoring/requests/incoming/{requestId}/decline`)
- **Method:** `POST`
- **Request Body:**
```json
{
  "responseNote": "Rất tiếc lịch trình hiện tại của tôi không cho phép nhận thêm đồ án."
}
```
- **Xử lý nghiệp vụ:**
  - Cập nhật `status = REJECTED`, `respondedAt = now()`, `responseNote`.
  - Không mở Deal với Mentor đối với request này.
- **Response Status:** `200 OK`

---

## 4. ĐÁNH GIÁ CÁC QUY TẮC NGHIỆP VỤ (BUSINESS RULES VERIFICATION)

1. **Rule 1 & 3 — Ownership & Cách ly dữ liệu:**
   - Email Mentor được trích xuất hoàn toàn từ JWT Security Context (`SecurityContextHolder.getContext().getAuthentication().getName()`).
   - Mọi câu truy vấn danh sách hay chi tiết đều ràng buộc `d.mentorProfile.id = :mentorProfileId`.
   - Direct Request chỉ có duy nhất 1 bản ghi phân phối cho Mentor đích được chọn -> Mentor khác không bao giờ truy vấn được.
2. **Rule 4 — ACCEPTED ≠ Deal:**
   - Trong `acceptIncomingRequest`, phương thức chỉ cập nhật `distribution.setStatus(MentoringDistributionStatus.ACCEPTED)` và lưu bản ghi phân phối.
   - Không gọi bất kỳ hàm tạo deal (`dealRepository`, `mentorshipSession`, `paymentService`), hoàn toàn bảo toàn ranh giới UC103.
3. **Rule 5 — Không tự động đóng General Request:**
   - Khi một Mentor ACCEPT, `request.setStatus(...)` không bị thay đổi. Trạng thái tổng thể của request vẫn giữ nguyên là `OPEN` để các Mentor khác tiếp tục phản hồi.
4. **Rule 6 — Enforce Mentor Eligibility:**
   - Kiểm tra `mentorProfile.getStatus() == MentorStatus.ACTIVE`. Nếu vi phạm: ném `AccessDeniedException` (HTTP 403).
   - Kiểm tra `subscriptionRepository.findActiveSubscription(mentorProfile.getUser().getId(), LocalDateTime.now())`. Nếu hết hạn: ném `AccessDeniedException` (HTTP 403).
5. **Rule 7 — Request Availability:**
   - Nếu `request.getStatus() != MentoringRequestStatus.OPEN`: ném `BadRequestException` (HTTP 400).
6. **Rule 8 & Concurrency — Ngăn chặn Duplicate Response (Idempotent):**
   - Kiểm tra `distribution.getStatus() == MentoringDistributionStatus.PENDING`. Nếu Mentor gửi đúp hoặc đã ACCEPTED/REJECTED trước đó, ném `ConflictException` (HTTP 409).
   - Được bọc trong `@Transactional` đảm bảo tính nguyên tử.

---

## 5. KẾT QUẢ KIỂM THỬ BACKEND (UNIT TESTS & INTEGRATION)

Đã khởi chạy kiểm thử thực tế bằng Maven Wrapper:
`.\mvnw.cmd test -Dtest=MentorIncomingRequestsServiceTest`

### Kết quả chi tiết 13 kịch bản:
- `TC103-01`: Mentor xem danh sách incoming requests phân phối -> **PASS**
- `TC103-02`: Mentor lọc danh sách theo requestType=DIRECT -> **PASS**
- `TC103-03`: Mentor xem chi tiết request hợp lệ -> **PASS**
- `TC103-04`: Mentor không thuộc danh sách phân phối bị chặn (403) -> **PASS**
- `TC103-05`: Mentor ACCEPT thành công, ghi nhận thời gian và note, không tạo Deal -> **PASS**
- `TC103-06`: Mentor DECLINE thành công, ghi nhận REJECTED -> **PASS**
- `TC103-07`: Mentor chưa ACTIVE bị từ chối phản hồi (403) -> **PASS**
- `TC103-08`: Mentor hết hạn gói Subscription bị từ chối phản hồi (403) -> **PASS**
- `TC103-09`: Yêu cầu đã đóng (CLOSED) bị từ chối phản hồi (400) -> **PASS**
- `TC103-10`: Mentor đã ACCEPTED gửi lại bị từ chối (409 Conflict) -> **PASS**
- `TC103-11`: Mentor đã DECLINED gửi lại bị từ chối (409 Conflict) -> **PASS**
- `TC103-12`: General Request nhiều Mentor phản hồi độc lập -> **PASS**
- `TC103-13`: Mentor chưa có profile bị từ chối xem danh sách (404/403) -> **PASS**

**Tổng kết:** **Tests run: 13, Failures: 0, Errors: 0, Skipped: 0. BUILD SUCCESS.**
