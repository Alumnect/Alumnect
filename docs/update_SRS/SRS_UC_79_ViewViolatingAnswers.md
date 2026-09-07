# ĐẶC TẢ YÊU CẦU & THIẾT KẾ CHI TIẾT: UC79 - XEM CÂU TRẢ LỜI VI PHẠM (VIEW VIOLATING ANSWERS)

## PHẦN 1: ĐẶC TẢ NGHIỆP VỤ (REPORT 3)

### 2.2.3 Business Workflow (Luồng nghiệp vụ)

```mermaid
stateDiagram-v2
    [*] --> Cho_Xu_Ly : Người dùng báo cáo câu trả lời (status = PENDING)
    Cho_Xu_Ly --> WebSocket_Broadcast : Phát tin nhắn STOMP real-time đến Admin
    WebSocket_Broadcast --> Da_Giai_Quyet : Admin chọn "Đã giải quyết" (status = RESOLVED, có/không ẩn câu trả lời)
    WebSocket_Broadcast --> Da_Bo_Qua : Admin chọn "Bỏ qua báo cáo" (status = DISMISSED)
    Da_Giai_Quyet --> [*] : Hoàn thành
    Da_Bo_Qua --> [*] : Hoàn thành
```

#### Mô tả chi tiết luồng xử lý bằng chữ (Business Step Description):
* **Bước 1 - Gửi báo cáo & Phát Real-time**: Khi người dùng (Student/Alumni) gửi báo cáo câu trả lời vi phạm qua API `POST /api/v1/answers/{id}/reports`, hệ thống tạo một bản ghi báo cáo mới trong bảng `reports` ở trạng thái `PENDING`. Ngay lập tức, hệ thống phát đi thông báo WebSocket STOMP tới kênh `/topic/admin/reports/answers`.
* **Bước 2 - Nhận thông báo & Xem danh sách**: Admin đang truy cập Admin Console (tại `/admin/violating-answers` hoặc `/admin/moderation`) sẽ tự động nhận được thông báo đẩy thời gian thực và danh sách báo cáo vi phạm lập tức cập nhật live mà không cần tải lại trang. Admin có thể tìm kiếm, lọc theo trạng thái (`PENDING`, `RESOLVED`, `DISMISSED`) hoặc theo lý do vi phạm.
* **Bước 3 - Xem chi tiết & Xử lý**: Admin nhấp "Chi tiết" để mở Modal xem nội dung câu trả lời, tiêu đề câu hỏi chứa câu trả lời, tác giả câu trả lời, người gửi báo cáo và mô tả lý do. Admin có thể tùy chọn đánh dấu "Ẩn câu trả lời" (chuyển câu trả lời sang `HIDDEN`) và thực hiện một trong hai hành động:
  - Nhấn "Đã giải quyết": Gửi yêu cầu `PUT /api/v1/admin/reports/answers/{id}/status` với `status = RESOLVED` và `hideAnswer = true/false`.
  - Nhấn "Bỏ qua báo cáo": Gửi yêu cầu `PUT /api/v1/admin/reports/answers/{id}/status` với `status = DISMISSED` và `hideAnswer = false`.
* **Bước 4 - Hoàn thành**: Bản ghi báo cáo chuyển trạng thái tương ứng (`RESOLVED` hoặc `DISMISSED`) và câu trả lời gốc sẽ được ẩn/hiện công khai tương ứng trên diễn đàn Q&A.

---

### 3.2 Admin Dashboard & System (Module 6)
Module này cung cấp các tính năng quản lý, theo dõi KPIs, kiểm duyệt nội dung vi phạm và quản trị hệ thống dành riêng cho Quản trị viên (Admin) của hệ thống AlumNect.

#### 3.2.1 Xem danh sách câu trả lời vi phạm (UC79)

**Function trigger**:
*   **Navigation path**: Dashboard Admin -> Menu chọn "Báo cáo câu trả lời vi phạm" -> Route `/admin/violating-answers`
*   **Timing Frequency**: Khi trang được tải (screen mount) hoặc nhận sự kiện đẩy real-time STOMP từ máy chủ WebSocket.

**Function description**:
*   **Actors/Roles**: Admin
*   **Purpose**: Cho phép Admin kiểm tra, quản lý, xử lý các báo cáo vi phạm câu trả lời trên diễn đàn Q&A và quyết định ẩn/hiện các câu trả lời vi phạm tiêu chuẩn cộng đồng.
*   **Interface**:
    *   Huy hiệu trạng thái kết nối "Real-time Live" WebSocket.
    *   Các tab bộ lọc trạng thái: "Đang chờ xử lý" (PENDING), "Đã giải quyết" (RESOLVED), "Đã bỏ qua" (DISMISSED).
    *   Dropdown chọn lý do vi phạm: "Tất cả lý do", "Spam / Rác", "Nội dung không phù hợp", "Sai lệch thông tin", "Lừa đảo & Giả mạo", "Lý do khác".
    *   Ô tìm kiếm động: tìm kiếm theo nội dung câu trả lời, tiêu đề câu hỏi, tên/email người báo cáo, tên/email tác giả câu trả lời.
    *   Bảng danh sách báo cáo: hiển thị thông tin người báo cáo, lý do, nội dung câu trả lời, tiêu đề câu hỏi gốc, tác giả câu trả lời, trạng thái câu trả lời (Công khai, Đã ẩn, Đã xóa).
    *   Modal chi tiết báo cáo: hiển thị thông tin chi tiết người báo cáo, mô tả lý do, toàn bộ nội dung câu trả lời, thông tin câu hỏi gốc, nút toggle "Ẩn câu trả lời" và các nút "Đã giải quyết", "Bỏ qua báo cáo".

**Data processing**:
*   **GET List**: Nhận các tham số lọc, khởi tạo `AnswerReportSpecification` để truy vấn `SELECT` bảng `reports` JOIN với `answers`, `questions`, `users`, `user_profiles`.
*   **PUT Status**: Kiểm tra xem báo cáo câu trả lời có tồn tại hay không, cập nhật trạng thái báo cáo (`RESOLVED` hoặc `DISMISSED`) và cập nhật trạng thái câu trả lời (`AnswerStatus.HIDDEN` hoặc `AnswerStatus.ACTIVE`).
*   **WebSocket STOMP Broadcast**: Nhận thông điệp từ `/topic/admin/reports/answers` và tự động invalidate cache React Query `['admin-answer-reports']`.

**Screen layout**:
*   Figure 79.1: Màn hình Danh sách câu trả lời vi phạm với giao diện Pastel Premium và huy hiệu Real-time Live.
*   Figure 79.2: Modal chi tiết báo cáo câu trả lời vi phạm kèm tùy chọn ẩn/hiện câu trả lời và xác nhận xử lý.

**Function details**:
*   **Data**: Report ID, Answer ID, Answer Content, Answer Status, Question ID, Question Title, Answer Author User, Reporter User, Reason, Description, Status, CreatedAt.
*   **Validation**:
    *   Mã trạng thái cập nhật chỉ chấp nhận `RESOLVED` hoặc `DISMISSED`. Không chấp nhận `PENDING`.
    *   Mô tả lý do báo cáo tối đa 500 ký tự.
*   **Business rules**:
    *   Chỉ người dùng có vai trò `ADMIN` mới được phép xem và kiểm duyệt danh sách câu trả lời vi phạm.
    *   Tự động gửi thông báo WebSocket STOMP real-time tới Admin khi có người dùng gửi báo cáo câu trả lời mới.
    *   Không cho phép tác giả tự gửi báo cáo câu trả lời của chính mình.
    *   Mỗi người dùng chỉ được gửi tối đa 1 báo cáo cho cùng 1 câu trả lời.
*   **Error Handling**:
    *   Trả về `401 Unauthorized` nếu JWT thiếu hoặc hết hạn.
    *   Trả về `403 Forbidden` nếu vai trò không phải `ADMIN`.
    *   Trả về `404 Not Found` nếu không tìm thấy ID báo cáo câu trả lời.
    *   Trả về `400 Bad Request` nếu tham số trạng thái không hợp lệ.
*   **Normal case**: Lấy danh sách câu trả lời vi phạm thành công, trả về JSON bọc trong đối tượng ApiResponse chuẩn kèm mã HTTP 200 OK.
*   **Abnormal case**: Yêu cầu bị từ chối do phân quyền hoặc lỗi máy chủ, trả về thông báo lỗi tiếng Việt tương ứng.

---

### 5. Requirement Appendix (Phụ lục Yêu cầu)

#### 5.1 Business Rules (Quy tắc Nghiệp vụ)

| ID | Định nghĩa Quy tắc (Rule Definition) |
| :--- | :--- |
| BR-79-01 | Chỉ người dùng có vai trò `ADMIN` được phép xem danh sách và xử lý báo cáo câu trả lời vi phạm. |
| BR-79-02 | Khi có câu trả lời vi phạm mới được báo cáo, hệ thống tự động phát STOMP WebSocket broadcast tới kênh `/topic/admin/reports/answers`. |
| BR-79-03 | Trạng thái báo cáo câu trả lời gồm `PENDING` (Chờ xử lý), `RESOLVED` (Đã giải quyết), `DISMISSED` (Đã bỏ qua). |
| BR-79-04 | Admin có quyền quyết định chuyển trạng thái câu trả lời vi phạm sang `HIDDEN` (Đã ẩn) hoặc `ACTIVE` (Công khai) khi giải quyết báo cáo. |
| BR-79-05 | Tác giả câu trả lời không được phép tự gửi báo cáo vi phạm đối với câu trả lời của chính mình và mỗi người dùng chỉ được gửi 1 báo cáo duy nhất cho mỗi câu trả lời. |

#### 5.2 Common Requirements (Yêu cầu Chung)
*   Tất cả múi giờ hiển thị mặc định là Asia/Ho_Chi_Minh.
*   Mọi thông báo thành công hoặc thất bại đều được hiển thị qua Toast hoặc hộp thoại Modal xác nhận rõ ràng.
*   Giao diện tuân thủ bảng màu Pastel Premium (nền kem ấm `#faf4ec`, surface trắng `#ffffff`, chữ mận chín `#322c3f`, hiệu ứng kính mờ và viền chuyển màu).

#### 5.3 Application Messages List (Danh sách Thông điệp Ứng dụng)

| # | Mã thông điệp (Message code) | Loại thông điệp (Message Type) | Ngữ cảnh (Context) | Nội dung hiển thị (Content) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | MSG-UC79-01 | Inline / Toast | Lấy danh sách câu trả lời vi phạm thành công | Lấy danh sách câu trả lời vi phạm thành công |
| 2 | MSG-UC79-02 | Toast | Đã giải quyết báo cáo câu trả lời vi phạm thành công | Đã giải quyết báo cáo câu trả lời vi phạm |
| 3 | MSG-UC79-03 | Toast | Đã bỏ qua báo cáo câu trả lời vi phạm thành công | Đã bỏ qua báo cáo câu trả lời vi phạm |
| 4 | MSG-UC79-04 | Under field / Toast | Trạng thái báo cáo không hợp lệ | Trạng thái báo cáo không hợp lệ: {status} |
| 5 | MSG-UC79-05 | Under field / Toast | Không thể chuyển trạng thái báo cáo về PENDING | Không thể chuyển báo cáo về lại trạng thái PENDING. |
| 6 | MSG-UC79-06 | Inline / Login redirect | JWT Token hết hạn | Phiên đăng nhập không hợp lệ hoặc đã hết hạn. |
| 7 | MSG-UC79-07 | Inline | Người dùng thường cố ý truy cập API Admin | Chỉ Quản trị viên mới được phép truy cập tài nguyên này. |
| 8 | MSG-UC79-08 | Toast | Không tìm thấy ID báo cáo câu trả lời vi phạm | Không tìm thấy báo cáo vi phạm với ID: {id} |

---

## PHẦN 2: THIẾT KẾ CHI TIẾT (REPORT 4)

### 3. Detail Design (Thiết kế chi tiết)

#### 3.1 Xem danh sách và kiểm duyệt câu trả lời vi phạm (UC79)

##### 3.1.1 Class Diagram (Sơ đồ Lớp)

```mermaid
classDiagram
    class AdminAnswerReportController {
        -AnswerReportService answerReportService
        +getViolatingAnswers(query, reason, status, questionId, page, size) ResponseEntity
        +updateReportStatus(id, payload) ResponseEntity
    }
    
    class AnswerReportController {
        -AnswerReportService answerReportService
        +reportAnswer(id, request, currentUser) ResponseEntity
    }
    
    class AdminAnswerReportResponse {
        -Long id
        -Long answerId
        -String answerContent
        -AnswerStatus answerStatus
        -Long questionId
        -String questionTitle
        -Long answerAuthorId
        -String answerAuthorName
        -String answerAuthorEmail
        -Long reporterId
        -String reporterName
        -String reporterEmail
        -String reporterAvatarUrl
        -ReportReason reason
        -String description
        -ReportStatus status
        -Instant createdAt
    }
    
    class AnswerReportService {
        <<interface>>
        +reportAnswer(answerId, request, reporter) AdminAnswerReportResponse
        +getViolatingAnswers(query, reason, status, questionId, page, size) PageResponse
        +updateReportStatus(id, status, hideAnswer) void
    }
    
    class AnswerReportServiceImpl {
        -ReportRepository reportRepository
        -AnswerRepository answerRepository
        -AnswerReportMapper answerReportMapper
        -SimpMessagingTemplate messagingTemplate
        +reportAnswer(answerId, request, reporter) AdminAnswerReportResponse
        +getViolatingAnswers(query, reason, status, questionId, page, size) PageResponse
        +updateReportStatus(id, status, hideAnswer) void
    }
    
    class AnswerReportMapper {
        <<interface>>
        +toAdminResponse(report) AdminAnswerReportResponse
    }
    
    class ReportRepository {
        <<interface>>
        +existsByAnswerIdAndReporterId(answerId, reporterId) boolean
    }
    
    class AnswerRepository {
        <<interface>>
    }
    
    class Report {
        -Long id
        -User reporter
        -Post post
        -Question question
        -Answer answer
        -ReportReason reason
        -String description
        -ReportStatus status
        -Instant createdAt
    }

    AdminAnswerReportController --> AnswerReportService : calls
    AnswerReportController --> AnswerReportService : calls
    AnswerReportServiceImpl ..|> AnswerReportService : implements
    AnswerReportServiceImpl --> ReportRepository : uses
    AnswerReportServiceImpl --> AnswerRepository : uses
    AnswerReportServiceImpl --> AnswerReportMapper : uses
    AnswerReportServiceImpl --> Report : manipulates
    AnswerReportMapper ..> AdminAnswerReportResponse : converts
    AnswerReportMapper ..> Report : converts
```

###### Mô tả chi tiết cấu trúc các lớp (Class Design Description):
* **Lớp Controller**:
  * `AdminAnswerReportController.java`: Tiếp nhận các yêu cầu từ Admin để lấy danh sách câu trả lời vi phạm (`GET /admin/reports/answers`) và cập nhật trạng thái xử lý/ẩn câu trả lời (`PUT /admin/reports/answers/{id}/status`).
  * `AnswerReportController.java`: Tiếp nhận yêu cầu báo cáo câu trả lời vi phạm từ phía người dùng (`POST /answers/{id}/reports`).
* **Lớp DTO**:
  * `CreateAnswerReportRequest.java`: Chứa lý do và mô tả báo cáo từ phía Client.
  * `AdminAnswerReportResponse.java`: Chứa toàn bộ dữ liệu phản hồi bao gồm nội dung câu trả lời, tiêu đề câu hỏi chứa câu trả lời, tác giả, người báo cáo, lý do và trạng thái.
* **Lớp Service**: Giao diện `AnswerReportService.java` và lớp thực thi `AnswerReportServiceImpl.java` đảm nhận logic nghiệp vụ kiểm tra điều kiện báo cáo, phát thông báo STOMP real-time tới WebSocket broker, và truy vấn lọc động bằng Specifications.
* **Lớp Mapper**: `AnswerReportMapper.java` chuyển đổi giữa thực thể `Report` lồng nhau và DTO phẳng `AdminAnswerReportResponse`.
* **Lớp Repository & Entity**: `ReportRepository.java` và `AnswerRepository.java` thực thi thao tác dữ liệu xuống DB PostgreSQL với thực thể `Report.java` và `Answer.java`.

##### 3.1.2 Sequence Diagram (Sơ đồ Tuần tự)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Admin Console
    participant Controller as AdminAnswerReportController
    participant Service as AnswerReportServiceImpl
    participant Spec as AnswerReportSpecification
    participant Repo as ReportRepository
    participant ARepo as AnswerRepository
    participant DB as PostgreSQL

    Admin->>Controller: GET /admin/reports/answers?status=PENDING&page=0&size=10
    
    alt Chưa đăng nhập hoặc không phải ADMIN
        Note over Controller: Spring Security kiểm tra role ADMIN
        Controller-->>Admin: HTTP 403 Forbidden (ApiResponse lỗi)
    else Đăng nhập thành công với quyền ADMIN
        Controller->>Service: getViolatingAnswers(query, reason, "PENDING", null, 0, 10)
        Service->>Spec: filterAnswerReports(query, reason, "PENDING", null, null)
        Spec-->>Service: Specification<Report>
        Service->>Repo: findAll(spec, pageable)
        Repo->>DB: SELECT reports INNER JOIN answers/questions/users
        DB-->>Repo: Page<Report>
        Repo-->>Service: Page<Report>
        Service-->>Controller: PageResponse<AdminAnswerReportResponse>
        Controller-->>Admin: HTTP 200 OK (ApiResponse danh sách câu trả lời vi phạm)
    end

    Admin->>Controller: PUT /admin/reports/answers/{id}/status (payload: {"status": "RESOLVED", "hideAnswer": true})
    Controller->>Service: updateReportStatus(id, "RESOLVED", true)
    Service->>Repo: findById(id)
    alt Không tìm thấy báo cáo
        Repo-->>Service: Optional.empty
        Service-->>Controller: throw ResourceNotFoundException
        Controller-->>Admin: HTTP 404 Not Found (ApiResponse báo lỗi)
    else Tìm thấy báo cáo
        Repo-->>Service: Report Entity
        alt Trạng thái mới là PENDING (Không hợp lệ)
            Service-->>Controller: throw BadRequestException
            Controller-->>Admin: HTTP 400 Bad Request
        else Trạng thái hợp lệ (RESOLVED)
            Service->>Repo: save(Report RESOLVED)
            Repo->>DB: UPDATE reports SET status = 'RESOLVED'
            DB-->>Repo: OK
            opt hideAnswer = true
                Service->>ARepo: save(Answer HIDDEN)
                ARepo->>DB: UPDATE answers SET status = 'HIDDEN'
                DB-->>ARepo: OK
            end
            Service-->>Controller: void
            Controller-->>Admin: HTTP 200 OK (ApiResponse báo thành công)
        end
    end
```

###### Mô tả chi tiết luồng xử lý bằng chữ (Sequence Flow Description):
1.  **Luồng lấy danh sách câu trả lời vi phạm (GET List)**:
    *   Admin gửi yêu cầu GET tới `/admin/reports/answers`.
    *   Spring Security xác thực token JWT và vai trò `ADMIN` từ `Endpoints.java`. Nếu sai quyền, trả về HTTP 403 Forbidden.
    *   Controller chuyển tham số xuống `AnswerReportServiceImpl`. Service dùng `AnswerReportSpecification` lọc theo `answer_id IS NOT NULL`, trạng thái, lý do và từ khóa tìm kiếm.
    *   Repository truy vấn database PostgreSQL. Kết quả được ánh xạ sang `AdminAnswerReportResponse` và trả về bọc trong `PageResponse` mã 200 OK.
2.  **Luồng cập nhật trạng thái & ẩn câu trả lời (PUT Status)**:
    *   Admin gửi yêu cầu cập nhật trạng thái báo cáo vi phạm sang `RESOLVED` hoặc `DISMISSED`, kèm cờ `hideAnswer` (ẩn/mở ẩn câu trả lời gốc).
    *   Service tìm bản ghi `Report` trong DB. Nếu không tìm thấy, ném `ResourceNotFoundException` trả về mã 404.
    *   Nếu tìm thấy, Service cập nhật trạng thái của báo cáo. Nếu `hideAnswer = true`, Service tiếp tục cập nhật trạng thái của câu trả lời gốc trong bảng `answers` sang `HIDDEN`.
    *   Hệ thống lưu thay đổi xuống DB PostgreSQL, ghi nhận nhật ký SLF4J, và trả lại phản hồi HTTP 200 OK thành công cho Admin Console.
