# ĐẶC TẢ YÊU CẦU & THIẾT KẾ CHI TIẾT: UC123 - KIỂM DUYỆT NỘI DUNG TỰ ĐỘNG & BỘ LỌC TỪ CẤM ĐA NGÔN NGỮ (AUTOMATED CONTENT MODERATION PIPELINE)

## PHẦN 1: ĐẶC TẢ NGHIỆP VỤ (REPORT 3)

### 2.2.3 Business Workflow (Luồng nghiệp vụ)

```mermaid
stateDiagram-v2
    [*] --> GuiBaoCao : Thành viên gửi báo cáo vi phạm bài viết (UC24)
    GuiBaoCao --> LuuCSDL : Backend lưu bản ghi với trạng thái PENDING
    LuuCSDL --> BanSuKienAsync : Trả về HTTP 201 cho User & Phát sự kiện ReportCreatedEvent
    
    state TienTrinhKiemDuyetNgam {
        [*] --> NhanSuKien : Listener tiếp nhận ReportCreatedEvent (@Async)
        NhanSuKien --> ChuanHoaChuoi : Khử dấu tiếng Việt (NFD) & Leetspeak Decoding
        ChuanHoaChuoi --> QuetTuCam : Đối soát tệp từ cấm Vi/En và Whitelist (Trie/Set in-memory)
        QuetTuCam --> TinhDiemRuiRo : Tính toán điểm độc hại (Toxicity Score: 0.00 - 1.00)
        
        TinhDiemRuiRo --> PhanLoaiHanhDong
        state PhanLoaiHanhDong {
            [*] --> KiemTraNguong
            KiemTraNguong --> NguyCoCao : Score >= 0.85 (Vi phạm nghiêm trọng)
            KiemTraNguong --> NghiVan : 0.40 <= Score < 0.85 (Cần Admin xem xét)
            KiemTraNguong --> AnToan : Score < 0.40 (Độ tin cậy thấp)
            
            NguyCoCao --> TuDongAnBai : post.setStatus(HIDDEN) & report.setAutoModerated(true)
            TuDongAnBai --> AlertWebSocketKhan : Gửi alert CRITICAL_AUTO_HIDDEN tới /topic/admin/moderation-alerts
            
            NghiVan --> AlertWebSocketReview : Gửi alert REVIEW_REQUIRED tới Admin Dashboard
            AnToan --> GhiNhanDiemThap : Lưu điểm rủi ro thấp vào Report
        }
    }
    
    BanSuKienAsync --> TienTrinhKiemDuyetNgam
    TienTrinhKiemDuyetNgam --> AdminXemVaXuLy : Admin mở tab "Báo cáo vi phạm" (UC69)
    
    state AdminXemVaXuLy {
        [*] --> XemDanhSachUuTien : Danh sách tự động sắp xếp theo aiScore giảm dần
        XemDanhSachUuTien --> MoModalChiTiet : Bấm "Chi tiết" xem Risk Meter & Từ khóa vi phạm
        MoModalChiTiet --> ChonHanhDong
        ChonHanhDong --> GiaiQuyetBaoCao : Admin chọn "Đã giải quyết" (RESOLVED)
        ChonHanhDong --> BoQuaBaoCao : Admin chọn "Bỏ qua báo cáo" (DISMISSED)
    }
    
    AdminXemVaXuLy --> [*] : Hoàn tất chu trình kiểm duyệt
```

#### Mô tả chi tiết luồng xử lý bằng chữ (Business Step Description):
* **Bước 1 - Khởi đầu**: Khi thành viên (Student hoặc Alumni) phát hiện bài viết có dấu hiệu vi phạm chuẩn mực đạo đức, người dùng bấm nút "Báo cáo" trên thẻ bài viết và chọn lý do (UC24).
* **Bước 2 - Ghi nhận tức thì (Zero-Latency Guarantee)**: API `POST /api/v1/posts/{id}/reports` tiếp nhận request, kiểm tra rate limit (tối đa 5 report trong 10 phút), lưu bản ghi vào bảng `reports` với trạng thái ban đầu `PENDING`. Sau đó, hệ thống trả về HTTP 201 Created ngay lập tức cho người dùng và phát sự kiện `ReportCreatedEvent`.
* **Bước 3 - Kiểm duyệt bất đồng bộ ngầm (Asynchronous Pipeline)**: Lớp `ReportModerationListener` nhận sự kiện chạy trên thread pool riêng biệt:
  1. *Khử dấu & Chuẩn hóa chuỗi*: Sử dụng `ProfanityUtils` kết hợp `VietnameseStringUtils` để đưa văn bản về dạng không dấu, giải mã các biến thể leetspeak (thay số thành chữ) và loại bỏ ký tự phân cách cố ý lách luật (d.m, d-m).
  2. *Quét từ cấm đa ngôn ngữ*: Nạp sẵn 2.673 từ cấm tiếng Việt (`profanity_vi.txt`) và tiếng Anh (`profanity_en.txt`) vào bộ nhớ RAM. Đối soát với danh sách an toàn `profanity_whitelist.txt` (loại bỏ bắt nhầm cho các đại từ số nhiều như "các bạn", "các sinh viên" hoặc tên trường "FPT University").
  3. *Loại bỏ trùng lặp từ con (Sub-word Deduplication)*: Nếu đã bắt cụm từ dài (như "vãi lồn") thì không tính thêm từ con "lồn".
  4. *Phân tầng điểm rủi ro (Toxicity Score)*:
     - **Score >= 0.85 (Vi phạm nghiêm trọng)**: Tự động đổi trạng thái bài viết thành `PostStatus.HIDDEN`, đánh dấu `autoModerated = true`, và phát sóng cảnh báo khẩn cấp (Emergency Alert) tới Admin qua WebSocket channel `/topic/admin/moderation-alerts`.
     - **0.40 <= Score < 0.85 (Nghi vấn cần con người xem xét)**: Bài viết giữ nguyên trạng thái `ACTIVE`, đưa báo cáo lên hàng đầu danh sách ưu tiên của Admin và gửi WebSocket thông báo cần duyệt.
     - **Score < 0.40 (An toàn / Báo cáo không căn cứ)**: Cập nhật điểm số vào bản ghi báo cáo để phục vụ thống kê.
* **Bước 4 - Quản trị viên xử lý trên Dashboard (UC69-71)**:
  - Admin truy cập trang Quản lý báo cáo (`/admin/reports`). Bảng danh sách hiển thị cột "Đánh giá AI" với các pill badge màu đỏ pastel (Nguy cơ cao), vàng pastel (Nghi vấn) hoặc xanh pastel (An toàn).
  - Khi mở Modal chi tiết, Admin nhìn thấy thanh đo Risk Meter và toàn bộ danh sách từ khóa vi phạm bị phát hiện (`detectedKeywords`).
  - Admin bấm "Đã giải quyết" (`RESOLVED`) hoặc "Bỏ qua" (`DISMISSED`) để hoàn tất việc xử lý.

---

### 3.2 Admin Dashboard & System (Module 6)

#### 3.2.1 Kiểm duyệt nội dung tự động và quản lý báo cáo vi phạm (UC123)

**Function trigger**:
*   **Navigation path**: Dashboard Admin -> Menu trái chọn "Báo cáo vi phạm" -> Route `/admin/reports`
*   **Timing Frequency**: On demand khi Admin truy cập, hoặc nhận tín hiệu real-time từ WebSocket `/topic/admin/moderation-alerts`.

**Function description**:
*   **Actors/Roles**: Quản trị viên (`ADMIN`), Người dùng hệ thống (`STUDENT`, `ALUMNI`).
*   **Purpose**: Tự động phát hiện, ngăn chặn và loại bỏ nội dung xúc phạm, kích động bạo lực, từ ngữ thô tục mà không làm suy giảm tốc độ phản hồi của hệ thống.
*   **Interface**:
    *   Cột "Đánh giá AI" trên bảng danh sách báo cáo vi phạm với nhãn phần trăm điểm rủi ro và cờ "Tự động ẩn".
    *   Khối "Phân tích Kiểm duyệt Tự động" trong Modal chi tiết với thanh Risk Meter động và thẻ Pill Tag liệt kê từ cấm.
    *   Các nút thao tác nghiệp vụ: "Đã giải quyết", "Bỏ qua báo cáo", "Ẩn / Hủy ẩn bài viết".

**Data processing**:
*   Tự động lưu `ai_score`, `ai_flagged_reason`, `auto_moderated`, `detected_keywords` vào bảng `reports`.
*   Truy vấn danh sách thông qua `ReportSpecification` sắp xếp mặc định theo `ai_score DESC, created_at DESC`.
*   Cập nhật `reviewed_by` và `reviewed_at` khi Admin xác nhận giải quyết báo cáo.

---

### 5. Phụ lục Yêu cầu (Requirement Appendix)

#### 5.1 Business Rules (Quy tắc Nghiệp vụ)

| ID | Định nghĩa Quy tắc (Rule Definition) |
| :--- | :--- |
| **BR-123.01** | Khi người dùng gửi báo cáo vi phạm bài viết (UC24), API bắt buộc phải phản hồi HTTP 201 ngay lập tức. Toàn bộ logic chấm điểm AI và quét từ cấm phải thực thi bất đồng bộ (`@Async`). |
| **BR-123.02** | Toàn bộ từ điển từ cấm đa ngôn ngữ (Vi/En) và whitelist phải được nạp sẵn vào bộ nhớ RAM khi ứng dụng khởi động (`@PostConstruct`), không được phép đọc file I/O đĩa ở mỗi request. |
| **BR-123.03** | Nếu bài viết có điểm độc hại $Score \ge 0.85$, hệ thống bắt buộc phải tự động chuyển trạng thái bài viết sang `PostStatus.HIDDEN` và đánh dấu `auto_moderated = TRUE`. |
| **BR-123.04** | Nếu bài viết có điểm độc hại $0.40 \le Score < 0.85$, bài viết vẫn giữ nguyên trạng thái `ACTIVE` để tránh bắt nhầm (False Positive), đồng thời xếp ưu tiên lên đầu danh sách chờ Admin duyệt. |
| **BR-123.05** | Khi bài viết đã phát hiện cụm từ cấm dài (ví dụ: "vãi lồn"), hệ thống bắt buộc phải thực hiện khử trùng lặp từ con (Sub-word deduplication), không được đếm thêm từ đơn "lồn". |
| **BR-123.06** | Các đại từ số nhiều và thuật ngữ thông dụng có trong `profanity_whitelist.txt` (như "các bạn", "các sinh viên", "FPT University") phải được bỏ qua hoàn toàn, không tính vào điểm vi phạm. |
| **BR-123.07** | Bảng danh sách báo cáo vi phạm của Quản trị viên phải luôn ưu tiên sắp xếp theo điểm rủi ro AI giảm dần (`ai_score DESC`) trước, sau đó mới đến thời gian tạo (`created_at DESC`). |

---

## PHẦN 2: THIẾT KẾ KỸ THUẬT (TECHNICAL DESIGN)

### 2.1 Sơ đồ tuần tự hợp nhất (Unified Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Thành viên (Student/Alumni)
    actor Admin as Quản trị viên (Admin)
    participant Client as Frontend (React App)
    participant PostCtrl as PostController
    participant RepService as ReportServiceImpl
    participant EvtPub as ApplicationEventPublisher
    participant Listener as ReportModerationListener
    participant ModService as ContentModerationServiceImpl
    participant ProfService as ProfanityFilterServiceImpl
    participant WsTemplate as SimpMessagingTemplate
    participant AdminCtrl as AdminReportController
    participant AdminRepService as AdminReportServiceImpl
    participant DB as PostgreSQL

    %% Giai đoạn 1: User gửi báo cáo vi phạm
    User->>Client: Bấm "Báo cáo bài viết" (chọn lý do, nhập mô tả)
    Client->>PostCtrl: POST /api/v1/posts/{id}/reports
    PostCtrl->>RepService: reportPost(email, postId, request)
    RepService->>DB: Kiểm tra bài viết & Rate limit (5 report / 10 phút)
    RepService->>DB: INSERT INTO reports (post_id, reporter_id, reason, status='PENDING')
    RepService->>EvtPub: publishEvent(ReportCreatedEvent)
    RepService-->>PostCtrl: Trả về ReportResponse (201 Created)
    PostCtrl-->>Client: 201 Created (Đóng modal, hiển thị Toast thành công)

    %% Giai đoạn 2: Tiến trình kiểm duyệt ngầm Async
    Note over Listener,ProfService: Luồng xử lý bất đồng bộ ngầm (@Async)
    EvtPub->>Listener: handleReportCreated(event)
    Listener->>ModService: evaluateContent(postContent)
    ModService->>ProfService: findProfanities(postContent)
    ProfService->>ProfService: Khử dấu, giải mã leetspeak & đối soát Whitelist
    ProfService-->>ModService: Trả về danh sách detectedKeywords
    ModService->>ModService: Tính điểm rủi ro (Score 0.00 - 1.00)
    ModService-->>Listener: Trả về ModerationResult (score, autoHide, requiresReview)

    alt Kịch bản 1: Vi phạm nghiêm trọng (Score >= 0.85)
        Listener->>DB: UPDATE posts SET status = 'HIDDEN' WHERE id = postId
        Listener->>DB: UPDATE reports SET ai_score=score, auto_moderated=true, status='PENDING'
        Listener->>WsTemplate: convertAndSend("/topic/admin/moderation-alerts", payload: CRITICAL_AUTO_HIDDEN)
    else Kịch bản 2: Nghi vấn cần con người xem xét (0.40 <= Score < 0.85)
        Listener->>DB: UPDATE reports SET ai_score=score, auto_moderated=false, status='PENDING'
        Listener->>WsTemplate: convertAndSend("/topic/admin/moderation-alerts", payload: REVIEW_REQUIRED)
    else Kịch bản 3: Nội dung an toàn hoặc rủi ro thấp (Score < 0.40)
        Listener->>DB: UPDATE reports SET ai_score=score, auto_moderated=false
    end

    %% Giai đoạn 3: Admin xem và xử lý báo cáo
    Admin->>Client: Mở trang Quản lý báo cáo (/admin/reports)
    Client->>AdminCtrl: GET /api/v1/admin/reports?status=PENDING&page=0&size=10
    AdminCtrl->>AdminRepService: getReports(filters...)
    AdminRepService->>DB: SELECT * FROM reports ORDER BY ai_score DESC, created_at DESC
    AdminRepService-->>AdminCtrl: PageResponse<AdminReportResponse>
    AdminCtrl-->>Client: 200 OK (Kèm aiScore, riskLevel, detectedKeywords)
    Client-->>Admin: Hiển thị bảng Pastel với Pill Badge mức độ rủi ro

    Admin->>Client: Mở Modal chi tiết & Nhấn "Đã giải quyết"
    Client->>AdminCtrl: PUT /api/v1/admin/reports/{id}/status (status='RESOLVED')
    AdminCtrl->>AdminRepService: updateReportStatus(id, 'RESOLVED')
    AdminRepService->>DB: UPDATE reports SET status='RESOLVED', reviewed_at=now() WHERE id = id
    AdminRepService-->>AdminCtrl: void
    AdminCtrl-->>Client: 200 OK (Cập nhật giao diện)
```

#### Mô tả chi tiết sơ đồ tuần tự:
* **Các bước 1 - 7**: Thành viên thực hiện gửi báo cáo bài viết. Backend kiểm tra tính hợp lệ, lưu bản ghi vào PostgreSQL và trả về HTTP 201 ngay lập tức. Sau đó phát sự kiện nội bộ `ReportCreatedEvent` qua `ApplicationEventPublisher`.
* **Các bước 8 - 14**: Listener bất đồng bộ tiếp nhận sự kiện, chuyển tiếp nội dung bài viết sang `ContentModerationServiceImpl`. Lớp `ProfanityFilterServiceImpl` thực hiện chuẩn hóa, khử leetspeak, quét từ cấm và loại trừ từ ngữ an toàn theo whitelist.
* **Các bước 15 - 20 (Rẽ nhánh theo ngưỡng điểm rủi ro)**:
  - Nếu điểm rủi ro $\ge 0.85$: Hệ thống cập nhật bảng `posts` sang `HIDDEN`, cập nhật `reports.auto_moderated = true` và bắn WebSocket alert tới Admin.
  - Nếu $0.40 \le Score < 0.85$: Bài viết giữ nguyên trạng thái công khai, cập nhật điểm số và phát tín hiệu xem xét tới Admin.
  - Nếu $Score < 0.40$: Cập nhật điểm rủi ro thấp vào bản ghi báo cáo.
* **Các bước 21 - 31**: Admin truy cập hệ thống, danh sách báo cáo được sắp xếp tự động ưu tiên theo `ai_score DESC`. Admin xem chi tiết từ khóa vi phạm trên Modal và tiến hành xác nhận giải quyết báo cáo.

---

### 2.2 Biểu đồ lớp chi tiết (Detailed Class Diagram)

```mermaid
classDiagram
    class Report {
        -Long id
        -Post post
        -User reporter
        -ReportReason reason
        -String description
        -ReportStatus status
        -Instant createdAt
        -Double aiScore
        -String aiFlaggedReason
        -Boolean autoModerated
        -String detectedKeywords
        -User reviewedBy
        -Instant reviewedAt
        +onCreate()
    }

    class Post {
        -Long id
        -User author
        -PostCategory category
        -String content
        -PostStatus status
    }

    class ProfanityFilterService {
        <<interface>>
        +containsProfanity(String text) boolean
        +findProfanities(String text) List~String~
        +maskProfanity(String text) String
    }

    class ProfanityFilterServiceImpl {
        -Set~String~ profanities
        -Set~String~ whitelist
        -List~String~ sortedProfanities
        +init() void
        +containsProfanity(String text) boolean
        +findProfanities(String text) List~String~
        +maskProfanity(String text) String
        -loadProfanitiesFromResource(String path) void
        -loadWhitelistFromResource(String path) void
        -isWhitelisted(String badWord, String paddedText) boolean
        -buildFlexibleRegex(String normalizedWord) String
    }

    class ContentModerationService {
        <<interface>>
        +evaluateContent(String text) ModerationResult
    }

    class ContentModerationServiceImpl {
        -ProfanityFilterService profanityFilterService
        +evaluateContent(String text) ModerationResult
    }

    class ModerationResult {
        -double score
        -List~String~ detectedKeywords
        -String flaggedReason
        -boolean autoHide
        -boolean requiresReview
    }

    class ReportModerationListener {
        -ContentModerationService contentModerationService
        -ReportRepository reportRepository
        -PostRepository postRepository
        -SimpMessagingTemplate messagingTemplate
        +handleReportCreated(ReportCreatedEvent event) void
        -broadcastAdminAlert(String alertType, Report report, ModerationResult result) void
    }

    class ReportCreatedEvent {
        -Long reportId
        -Long postId
        -String postContent
        -String reason
        -Long reporterId
    }

    class AdminReportResponse {
        -Long id
        -Long postId
        -String postContent
        -String postStatus
        -ReportReason reason
        -ReportStatus status
        -Instant createdAt
        -Double aiScore
        -String aiFlaggedReason
        -Boolean autoModerated
        -String detectedKeywords
        -String riskLevel
    }

    ProfanityFilterService <|.. ProfanityFilterServiceImpl : implements
    ContentModerationService <|.. ContentModerationServiceImpl : implements
    ContentModerationServiceImpl --> ProfanityFilterService : uses
    ContentModerationServiceImpl ..> ModerationResult : produces
    ReportModerationListener --> ContentModerationService : evaluates
    ReportModerationListener ..> ReportCreatedEvent : listens
    ReportModerationListener --> Report : updates
    ReportModerationListener --> Post : moderates
    Report --> Post : targets
    AdminReportResponse ..> Report : maps from
```
