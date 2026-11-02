# ĐẶC TẢ YÊU CẦU & THIẾT KẾ CHI TIẾT: UC28 - VIEW ATTENDED-EVENT HISTORY

## PHẦN 1: ĐẶC TẢ NGHIỆP VỤ (REPORT 3)

### 2.2.3 Business Workflow (Luồng nghiệp vụ)

```mermaid
stateDiagram-v2
    [*] --> Truy_Cap_Trang_Su_Kien : Người dùng vào trang /app/events
    Truy_Cap_Trang_Su_Kien --> Chon_Tab_Lich_Su : Chọn tab "Lịch sử tham gia"
    
    Chon_Tab_Lich_Su --> Kiem_Tra_Dang_Nhap : Kiểm tra phiên JWT người dùng
    Kiem_Tra_Dang_Nhap --> Yeu_Cau_Dang_Nhap : Chưa đăng nhập (Guest)
    Yeu_Cau_Dang_Nhap --> [*] : Hiển thị EmptyState nhắc đăng nhập
    
    Kiem_Tra_Dang_Nhap --> Kiem_Tra_Vai_Tro : Đã đăng nhập
    Kiem_Tra_Vai_Tro --> Tu_Choi_Admin : Vai trò ADMIN
    Tu_Choi_Admin --> [*] : Hiển thị thông báo tài khoản Quản trị viên không áp dụng
    
    Kiem_Tra_Vai_Tro --> Goi_API_Lich_Su : Vai trò STUDENT hoặc ALUMNI
    Goi_API_Lich_Su --> Truy_Van_CSDL : GET /api/v1/events/my-history?page=0&size=10&filter=all
    
    Truy_Van_CSDL --> Tinh_Toan_Trang_Thai : Lọc theo filter & tính toán attendanceState
    Tinh_Toan_Trang_Thai --> Hien_Thi_Danh_Sach : Trả về PageResponse<EventHistoryResponse>
    
    Hien_Thi_Danh_Sach --> Loc_Theo_Pill : Người dùng chuyển pill (all / upcoming / past / cancelled)
    Loc_Theo_Pill --> Goi_API_Lich_Su : Gọi lại API với filter tương ứng
    
    Hien_Thi_Danh_Sach --> Huy_Dang_Ky_Rsvp : Nhấn "Hủy đăng ký" trên sự kiện sắp tới
    Huy_Dang_Ky_Rsvp --> Mo_Modal_Huy : Xác nhận qua CancelRsvpModal
    Mo_Modal_Huy --> Cap_Nhat_Sau_Huy : Hủy thành công -> Tự động refresh lịch sử
    
    Hien_Thi_Danh_Sach --> Xem_Chi_Tiet_Bai_Viet : Bấm "Chi tiết"
    Xem_Chi_Tiet_Bai_Viet --> Chuyen_Trang_Post : Chuyển hướng tới /app/posts/:postId
    
    Hien_Thi_Danh_Sach --> Tai_Them_Trang : Bấm "Tải thêm lịch sử" (hasNextPage)
    Tai_Them_Trang --> Goi_API_Lich_Su : Tải trang kế tiếp và nối dữ liệu
```

#### Mô tả chi tiết luồng xử lý:
* **Bước 1 - Truy cập giao diện**: Người dùng truy cập trang Sự kiện & Họp mặt (`/app/events`) và bấm chọn tab **"Lịch sử tham gia"**.
* **Bước 2 - Kiểm tra xác thực & vai trò (RBAC Check)**:
  * Nếu là khách vãng lai (chưa đăng nhập), giao diện hiển thị trạng thái yêu cầu đăng nhập kèm nút kích hoạt modal đăng nhập.
  * Nếu là quản trị viên (`ADMIN`), hệ thống giải thích vai trò Quản trị viên không tham gia vào hoạt động sự kiện cộng đồng.
  * Nếu là sinh viên (`STUDENT`) hoặc cựu sinh viên (`ALUMNI`), tiếp tục luồng dữ liệu.
* **Bước 3 - Truy vấn dữ liệu & tính toán trạng thái**:
  * Frontend gửi request `GET /api/v1/events/my-history?page=0&size=9&filter={filter}` kèm Bearer JWT.
  * Backend kiểm tra danh tính qua email trích xuất từ JWT, truy vấn bảng `event_registrations` kết hợp `events` theo `userId` và bộ lọc:
    * `all`: Lấy toàn bộ lịch sử đăng ký tham gia của người dùng.
    * `upcoming`: Lấy các sự kiện người dùng đang đăng ký (`REGISTERED`) và chưa diễn ra (`start_time > now`).
    * `past`: Lấy các sự kiện người dùng đã tham gia (`REGISTERED`) và đã diễn ra hoặc kết thúc (`start_time <= now`).
    * `cancelled`: Lấy các lượt đăng ký người dùng đã hủy (`reg.status = CANCELLED`) hoặc các sự kiện đã bị ban tổ chức hủy (`event.status = CANCELLED`).
  * Backend chuẩn hóa trạng thái trực quan `attendanceState`:
    * `UPCOMING`: Sự kiện sắp diễn ra và người dùng đang giữ chỗ hợp lệ.
    * `ONGOING`: Sự kiện đang trong thời gian diễn ra.
    * `PAST`: Sự kiện đã kết thúc và người dùng đã tham gia.
    * `REGISTRATION_CANCELLED`: Người dùng chủ động hủy tham gia.
    * `EVENT_CANCELLED`: Ban tổ chức hủy bỏ sự kiện.
  * Dữ liệu trả về phân trang qua cấu trúc chuẩn `PageResponse<EventHistoryResponse>`.
* **Bước 4 - Tương tác trực tiếp trên lịch sử**:
  * Người dùng có thể lọc nhanh theo 4 tab con: *Tất cả*, *Sắp diễn ra*, *Đã tham gia*, *Đã hủy*.
  * Với các sự kiện sắp diễn ra, người dùng có thể thực hiện thao tác hủy đăng ký (Cancel RSVP) trực tiếp ngay tại thẻ sự kiện thông qua modal xác nhận. Khi hoàn tất, danh sách lịch sử tự động đồng bộ lại tức thì mà không cần tải lại toàn bộ trang web.
  * Nhấn vào "Chi tiết" để điều hướng sang bài viết gốc giới thiệu sự kiện.
  * Nhấn vào thông tin người tổ chức để xem hồ sơ cá nhân của cựu sinh viên phụ trách.

---

### 3.2 Module 3 - Social: Feed, Posts, Events, Packages & Messaging

#### 3.2.4 Xem lịch sử tham gia sự kiện (View Attended-Event History) - UC28

##### A. Bảng đặc tả Use Case chi tiết

| Mục | Nội dung |
| :--- | :--- |
| **Use Case ID** | UC28 |
| **Use Case Name** | Xem lịch sử tham gia sự kiện (View Attended-Event History) |
| **Module** | Module 3 - Social: Feed, Posts, Events, Packages & Messaging |
| **Actor** | Sinh viên (`STUDENT`), Cựu sinh viên (`ALUMNI`) |
| **Priority** | P2 (MoSCoW: Could Have) |
| **Trigger** | Người dùng chọn tab "Lịch sử tham gia" trên trang Sự kiện (`/app/events`) |
| **Preconditions** | 1. Người dùng đã đăng nhập hệ thống với vai trò `STUDENT` hoặc `ALUMNI`.<br>2. Token xác thực JWT còn hiệu lực. |
| **Postconditions** | Danh sách các sự kiện người dùng đã đăng ký được hiển thị đầy đủ, trực quan kèm thông tin trạng thái tham gia, thời gian, địa điểm, ban tổ chức và các thao tác liên quan. |

##### B. Business Rules (Quy tắc nghiệp vụ)

* **BR-01 (Role Restriction)**: Chỉ tài khoản có vai trò `STUDENT` và `ALUMNI` mới có quyền xem lịch sử tham gia sự kiện. Tài khoản `ADMIN` bị từ chối với mã lỗi `403 Forbidden`. Khách vãng lai (`GUEST`) bị từ chối với mã lỗi `401 Unauthorized`.
* **BR-02 (Data Isolation)**: Người dùng chỉ có thể xem lịch sử các sự kiện do chính tài khoản của mình thực hiện đăng ký (`event_registrations.user_id == current_user.id`), tuyệt đối không được xem lịch sử của người dùng khác.
* **BR-03 (Filter Criteria)**:
  * Bộ lọc `all`: Hiển thị tất cả bản ghi đăng ký tham gia sự kiện của người dùng, sắp xếp theo thời gian đăng ký mới nhất giảm dần.
  * Bộ lọc `upcoming`: Chỉ hiển thị các bản ghi có trạng thái đăng ký là `REGISTERED` và sự kiện chưa diễn ra (`start_time > now()`), sắp xếp theo thời gian bắt đầu sự kiện tăng dần.
  * Bộ lọc `past`: Chỉ hiển thị các bản ghi có trạng thái đăng ký là `REGISTERED` và sự kiện đã diễn ra hoặc đã kết thúc (`start_time <= now()`), sắp xếp theo thời gian bắt đầu sự kiện giảm dần.
  * Bộ lọc `cancelled`: Hiển thị các bản ghi mà người dùng đã hủy đăng ký (`reg.status = 'CANCELLED'`) hoặc sự kiện bị ban tổ chức hủy (`events.status = 'CANCELLED'`).
* **BR-04 (Attendance State Normalization)**:
  * Hệ thống tính toán trường `attendanceState` linh hoạt phục vụ hiển thị nhãn trạng thái (Badge) với màu sắc rõ ràng (Aqua, Gold, Green, Coral, Gray).
* **BR-05 (Action Interoperability)**:
  * Người dùng có thể hủy tham gia sự kiện sắp diễn ra thông qua nút hủy tích hợp sẵn trên thẻ sự kiện.
  * Mỗi thẻ sự kiện liên kết trực tiếp tới bài viết chi tiết và hồ sơ của người tổ chức.

---

#### 5.3 Application Messages List (Danh sách Thông điệp Ứng dụng)

| # | Mã thông điệp (Message code) | Loại thông điệp (Message Type) | Ngữ cảnh (Context) | Nội dung hiển thị (Content) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | MSG-EV-HIST-01 | Toast message | Lấy lịch sử sự kiện thành công | Lấy lịch sử tham gia sự kiện thành công. |
| 2 | MSG-EV-HIST-02 | EmptyState | Chưa có dữ liệu sự kiện đã tham gia | Bạn chưa tham gia sự kiện nào. Hãy khám phá và đăng ký các sự kiện mới! |
| 3 | MSG-EV-HIST-03 | EmptyState | Bộ lọc không có sự kiện tương ứng | Không có sự kiện nào trong danh mục này. |
| 4 | MSG-EV-HIST-04 | Alert Banner | Khách chưa đăng nhập vào tab lịch sử | Vui lòng đăng nhập để xem lịch sử sự kiện đã tham gia. |
| 5 | MSG-EV-HIST-05 | Toast Error | Quản trị viên truy cập trang lịch sử | Tài khoản Quản trị viên không áp dụng cho tính năng này. |

---

## PHẦN 2: THIẾT KẾ CHI TIẾT (REPORT 4)

### 3. Detail Design (Thiết kế chi tiết)

#### 3.1 UC28 Xem lịch sử tham gia sự kiện (View Attended-Event History)

##### 3.1.1 Class Diagram (Sơ đồ Lớp)

```mermaid
classDiagram
    %% Controller Layer
    class EventController {
        +getEventHistory(page: int, size: int, filter: String, authentication: Authentication) ResponseEntity~ApiResponse~PageResponse~EventHistoryResponse~~~
    }

    %% DTO Layer
    class EventHistoryResponse {
        -Long registrationId
        -String registrationStatus
        -Instant registeredAt
        -Long eventId
        -String title
        -String location
        -Instant startTime
        -Instant endTime
        -Integer capacity
        -int attendeeCount
        -String eventStatus
        -Long postId
        -String coverUrl
        -Long organizerId
        -String organizerName
        -String organizerAvatar
        -String attendanceState
    }

    %% Service Layer
    class EventService {
        <<interface>>
        +getEventHistory(userEmail: String, page: int, size: int, filter: String) PageResponse~EventHistoryResponse~
    }

    class EventServiceImpl {
        -EventRegistrationRepository registrationRepository
        -UserRepository userRepository
        -EventMapper eventMapper
        +getEventHistory(userEmail: String, page: int, size: int, filter: String) PageResponse~EventHistoryResponse~
    }

    %% Repository Layer
    class EventRegistrationRepository {
        <<interface>>
        +findByAttendeeIdWithFilters(attendeeId: Long, filter: String, pageable: Pageable) Page~EventRegistration~
    }

    class UserRepository {
        <<interface>>
        +findByEmail(email: String) Optional~User~
    }

    %% Entities
    class EventRegistration {
        -Long id
        -Event event
        -User attendee
        -RegistrationStatus status
        -Instant registeredAt
    }

    class Event {
        -Long id
        -User organizer
        -String title
        -Instant startTime
        -Instant endTime
        -EventStatus status
    }

    %% Frontend Components & Hooks
    class EventHistoryTab {
        +filter: string
        +render() JSX.Element
    }

    class useEventHistory {
        +data: PageResponse
        +isLoading: boolean
        +refetch() void
    }

    EventController ..> EventService : calls
    EventServiceImpl ..|> EventService : implements
    EventServiceImpl --> EventRegistrationRepository : queries
    EventServiceImpl --> UserRepository : queries
    EventServiceImpl --> EventRegistration : reads
    EventServiceImpl ..> EventHistoryResponse : maps
    EventHistoryTab ..> useEventHistory : uses
    useEventHistory ..> EventController : HTTP GET
```

###### Mô tả chi tiết cấu trúc các lớp (Class Design Description):
* **Lớp Controller (`EventController.java`)**: Cung cấp API `GET /api/v1/events/my-history` (kèm alias `/history`), tiếp nhận các tham số phân trang (`page`, `size`) và bộ lọc (`filter`), trích xuất thông tin người dùng từ JWT.
* **Lớp DTO (`EventHistoryResponse.java`)**: Đóng gói toàn diện thông tin sự kiện, thông tin người tổ chức và trạng thái tính toán động `attendanceState` (`UPCOMING`, `ONGOING`, `PAST`, `CANCELLED`).
* **Lớp Service (`EventService.java`, `EventServiceImpl.java`)**: Xác định định danh người dùng qua email, truy vấn các lượt đăng ký có phân trang từ `EventRegistrationRepository` và chuyển đổi sang danh sách `EventHistoryResponse`.
* **Lớp Repository & Entity (`EventRegistrationRepository.java`, `EventRegistration.java`, `Event.java`)**: Quản lý quan hệ Many-to-One giữa người tham gia và sự kiện, hỗ trợ truy vấn tối ưu kèm thông tin liên kết bài viết (`posts`).
* **Lớp Frontend (`EventHistoryTab.tsx`, `useEventHistory.ts`)**: Component hiển thị danh sách thẻ lịch sử sự kiện với các chip lọc trạng thái và hỗ trợ tải thêm phân trang vô tận hoặc nút "Tải thêm".

##### 3.1.2 Sequence Diagram (Sơ đồ Tuần tự)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng (Student/Alumni)
    participant UI as EventHistoryTab (FE)
    participant Controller as EventController
    participant Service as EventServiceImpl
    participant UserRepo as UserRepository
    participant RegRepo as EventRegistrationRepository
    participant DB as PostgreSQL

    User->>UI: Mở tab "Lịch sử tham gia" (chọn filter: all/upcoming/past/cancelled)
    UI->>Controller: GET /api/v1/events/my-history?page=0&size=9&filter={filter} (Bearer JWT)
    
    alt Trường hợp 1: Người dùng chưa đăng nhập (Guest)
        Controller-->>UI: HTTP 401 Unauthorized
        UI-->>User: Hiển thị EmptyState nhắc đăng nhập & nút "Đăng nhập ngay"
        
    else Trường hợp 2: Tài khoản Quản trị viên (ADMIN)
        Controller-->>UI: HTTP 403 Forbidden
        UI-->>User: Hiển thị thông báo tài khoản Admin không áp dụng
        
    else Trường hợp 3: Người dùng hợp lệ (Student / Alumni)
        Controller->>Service: getEventHistory(userEmail, page, size, filter)
        Service->>UserRepo: findByEmail(userEmail)
        UserRepo->>DB: SELECT * FROM users WHERE email = ?
        DB-->>UserRepo: User entity
        UserRepo-->>Service: User attendee
        
        Service->>RegRepo: findByAttendeeIdWithFilters(attendee.id, filter, pageable)
        RegRepo->>DB: SELECT reg.*, e.* FROM event_registrations reg JOIN events e ON reg.event_id = e.id WHERE reg.user_id = ? ... ORDER BY reg.registered_at DESC
        DB-->>RegRepo: Page<EventRegistration>
        RegRepo-->>Service: Page<EventRegistration>
        
        Note over Service: Tính toán attendanceState cho từng sự kiện:<br/>- e.status == 'CANCELLED' -> EVENT_CANCELLED<br/>- reg.status == 'CANCELLED' -> REGISTRATION_CANCELLED<br/>- now < startTime -> UPCOMING<br/>- now between start và end -> ONGOING<br/>- now > endTime -> PAST
        
        Service-->>Controller: PageResponse<EventHistoryResponse>
        Controller-->>UI: HTTP 200 OK (ApiResponse: "Lấy lịch sử tham gia sự kiện thành công", PageResponse)
        
        alt Danh sách trống
            UI-->>User: Hiển thị EmptyState thân thiện "Chưa có sự kiện nào"
        else Có dữ liệu
            UI-->>User: Render danh sách card lịch sử sự kiện với badge trạng thái tương ứng
        end
    end
```

###### Mô tả chi tiết luồng xử lý bằng chữ (Sequence Flow Description):
1. **Luồng 1 - Thành công (Normal Case)**: Người dùng hợp lệ truy cập tab lịch sử sự kiện. Backend xác thực tài khoản qua JWT, truy vấn bảng `event_registrations` lọc theo `userId` và trạng thái `filter`, tính toán cờ trạng thái trực quan `attendanceState` theo mốc thời gian thực của máy chủ, đóng gói trả về `PageResponse<EventHistoryResponse>` với mã `200 OK`.
2. **Luồng 2 - Ngoại lệ Chưa đăng nhập (Unauthorized Case)**: Khách vãng lai cố truy cập API lịch sử sự kiện. Spring Security chặn trước Controller và trả về `HTTP 401 Unauthorized`. Frontend bắt lỗi và hiển thị giao diện thông báo yêu cầu đăng nhập.
3. **Luồng 3 - Ngoại lệ Phân quyền (Forbidden Case)**: Tài khoản Admin gọi API. Hệ thống từ chối với `HTTP 403 Forbidden` vì Quản trị viên không tham gia vào luồng sự kiện của sinh viên/cựu sinh viên.


### 1. Database Schema

UC28 tận dụng toàn bộ các bảng cơ sở dữ liệu sẵn có của hệ thống, không yêu cầu tạo mới bảng hay chạy migration bổ sung:
* Bảng `events`: Lưu trữ thông tin sự kiện (tiêu đề, địa điểm, thời gian bắt đầu/kết thúc, trạng thái, người tổ chức).
* Bảng `event_registrations`: Lưu vết lịch sử đăng ký tham gia (`user_id`, `event_id`, `status`, `registered_at`).
* Bảng `posts`: Lưu trữ bài viết liên kết, ảnh bìa sự kiện (`post_media`).
* Bảng `users` & `user_profiles`: Cung cấp thông tin tên và ảnh đại diện ban tổ chức.

### 2. REST API Specification

#### Endpoint: Xem lịch sử tham gia sự kiện của người dùng hiện tại
* **Method & Path**: `GET /api/v1/events/my-history` (hỗ trợ alias: `GET /api/v1/events/history`)
* **Security**: Bearer JWT (Role: `STUDENT`, `ALUMNI`)
* **Request Parameters**:
  * `page` (integer, optional, default: 0): Chỉ số trang (0-indexed).
  * `size` (integer, optional, default: 10): Số phần tử trên mỗi trang.
  * `filter` (string, optional, default: 'all'): Bộ lọc trạng thái (`all`, `upcoming`, `past`, `cancelled`).
* **Responses**:
  * `200 OK`:
    ```json
    {
      "code": 200,
      "message": "Lấy lịch sử tham gia sự kiện thành công!",
      "data": {
        "content": [
          {
            "registrationId": 12,
            "registrationStatus": "REGISTERED",
            "registeredAt": "2026-09-08T03:00:00Z",
            "eventId": 100,
            "title": "Hội thảo Công nghệ AI & Xu hướng 2026",
            "location": "Hội trường A, Đại học FPT TP.HCM",
            "startTime": "2026-09-20T08:30:00Z",
            "endTime": "2026-09-20T11:30:00Z",
            "capacity": 150,
            "attendeeCount": 45,
            "eventStatus": "ACTIVE",
            "postId": 55,
            "coverUrl": "https://storage.alumnect.edu.vn/media/events/ai-tech-2026.jpg",
            "organizerId": 10,
            "organizerName": "Nguyễn Văn A",
            "organizerAvatar": "https://storage.alumnect.edu.vn/avatars/user-10.png",
            "attendanceState": "UPCOMING"
          }
        ],
        "pageNumber": 0,
        "pageSize": 10,
        "totalElements": 1,
        "totalPages": 1,
        "last": true
      }
    }
    ```
  * `401 Unauthorized`: Người dùng chưa đăng nhập hoặc token đã hết hạn.
  * `403 Forbidden`: Người dùng không có quyền truy cập (vai trò `ADMIN`).
