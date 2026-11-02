# ĐẶC TẢ YÊU CẦU & THIẾT KẾ CHI TIẾT: UC96 - XEM CV MENTOR

## PHẦN 1: ĐẶC TẢ NGHIỆP VỤ (REPORT 3)

### 2.2.3 Business Workflow (Luồng nghiệp vụ)

```mermaid
stateDiagram-v2
    [*] --> Tab_Admin_Users : Admin mở danh sách người dùng/Mentor
    Tab_Admin_Users --> Yeu_Cau_Xem_CV : Kích hoạt nút "CV Mentor"
    Yeu_Cau_Xem_CV --> Kiem_Tra_Quyen_Admin : Hệ thống kiểm tra Security Token (ROLE_ADMIN)
    
    state Kiem_Tra_Quyen_Admin {
        [*] --> Validating_Role
        Validating_Role --> Denied : Từ chối (HTTP 403)
        Validating_Role --> Allowed : Hợp lệ
    }
    
    Denied --> Thong_Bao_Tu_Choi : Hiển thị lỗi từ chối truy cập
    Allowed --> Truy_Van_CSDL_PostgreSQL : Gọi GET /api/v1/admin/mentors/{mentorId}/cv
    
    state Truy_Van_CSDL_PostgreSQL {
        [*] --> Check_Profile_Exists
        Check_Profile_Exists --> Profile_Not_Found : Không tìm thấy mentorProfileId
        Check_Profile_Exists --> Check_CV_Key : Hồ sơ tồn tại
        Check_CV_Key --> CV_Missing : cv_file_key IS NULL hoặc rỗng
        Check_CV_Key --> CV_Available : Tệp CV hợp lệ
    }
    
    Profile_Not_Found --> Thong_Bao_Loi_CSDL : Trả về lỗi 404
    CV_Missing --> Thong_Bao_Chua_Cap_Nhat_CV : Trả về lỗi 404 (Chưa có CV)
    CV_Available --> Hien_Thi_Modal_CV_Viewer : Trả về HTTP 200 OK
    
    Hien_Thi_Modal_CV_Viewer --> Direct_Preview : Hiển thị iframe xem trực tiếp CV
    Hien_Thi_Modal_CV_Viewer --> Download_CV : Tải về tệp CV / Mở tab mới
    
    Thong_Bao_Tu_Choi --> [*]
    Thong_Bao_Loi_CSDL --> [*]
    Thong_Bao_Chua_Cap_Nhat_CV --> [*]
    Direct_Preview --> Dong_Modal : Admin nhấn nút "Đóng" (Trạng thái Mentor giữ nguyên)
    Download_CV --> Dong_Modal
    Dong_Modal --> [*]
```

#### Mô tả chi tiết luồng xử lý bằng chữ (Business Step Description):
* **Bước 1 - Khởi đầu**: Quản trị viên (Admin) mở màn hình Quản lý người dùng/Mentor (`/admin/users`), chọn một cựu sinh viên (ALUMNI) hoặc Mentor và nhấn nút **"CV Mentor"**.
* **Bước 2 - Kiểm tra quyền**: Hệ thống (Spring Security) xác thực Bearer JWT Token của người dùng. Nếu vai trò không phải `ADMIN`, hệ thống từ chối truy cập (trả về lỗi HTTP 403 Forbidden).
* **Bước 3 - Truy vấn dữ liệu**: Hệ thống thực hiện truy vấn bảng `mentor_profiles`, `users`, `user_profiles`, `experiences` và `mentor_supported_fields` trong CSDL PostgreSQL.
* **Bước 4 - Xử lý ngoại lệ**:
  - Nếu `mentorProfileId` không tồn tại -> Trả về HTTP 404 Not Found (`"Không tìm thấy hồ sơ Mentor với ID"`).
  - Nếu `cv_file_key` chưa được lưu hoặc rỗng -> Trả về HTTP 404 Not Found (`"Mentor này chưa cập nhật tệp CV lên hệ thống"`).
* **Bước 5 - Kết thúc**: Hệ thống trả về thông tin DTO `AdminMentorCvResponse` bọc trong `ApiResponse`. Frontend hiển thị `AdminMentorCvModal` chứa thông tin chuyên môn và trình nhúng xem CV trực tiếp (`iframe`) kèm nút tải về tệp CV. **Trạng thái kinh doanh của Mentor giữ nguyên 100%, không bị tác động.**

---

### 3.2 Module Quản trị hệ thống (Admin Management Module)
Module Quản trị hệ thống quản lý các tài khoản người dùng, báo cáo vi phạm, phân tích dữ liệu và hồ sơ kinh doanh của các Mentor trên nền tảng AlumNect.

#### 3.2.1 Xem CV Mentor (UC96 - Admin View Mentor CV)

**Function trigger**:
*   **Navigation path**: Dashboard Admin -> Quản lý thành viên (`/admin/users`) -> Chọn thành viên Alumni / Mentor -> Nhấn nút **"CV Mentor"**
*   **Timing Frequency**: On demand (bất cứ khi nào Admin cần xem và đối chứng thông tin chuyên môn của Mentor).

**Function description**:
*   **Actors/Roles**: Admin (Quản trị viên)
*   **Purpose**: Cho phép Admin xem, kiểm tra chi tiết CV của Mentor để phục vụ công tác quản lý và đối chứng thông tin, không tạo ra bất kỳ quy trình phê duyệt hay từ chối (Approve/Reject) nào.
*   **Interface**:
    *   **Nút kích hoạt**: Nút bấm màu Cam - Trắng FPT (`#F27024`) có icon `<FileText />` trực tiếp tại bảng danh sách người dùng.
    *   **Giao diện Modal (`AdminMentorCvModal`)**:
        - Thẻ thông tin Mentor: Ảnh đại diện, Họ tên, Email, Vị trí hiện tại, Công ty, Lĩnh vực cố vấn hỗ trợ.
        - Khung xem tệp trực tiếp (`<iframe src={cvUrl} />`).
        - Nút hành động: "Mở trong tab mới", "Tải về tệp CV", "Đóng cửa sổ".
        - Banner cảnh báo quy tắc nghiệp vụ UC96.

**Data processing**:
1. Frontend gửi yêu cầu `GET /api/v1/admin/mentors/{mentorId}/cv` kèm Bearer Token của Admin.
2. Spring Boot kiểm tra Annotation `@PreAuthorize("hasRole('ADMIN')")`.
3. `AdminMentorCvServiceImpl` tìm kiếm đối tượng `MentorProfile` trong DB bằng `mentorProfileId`.
4. Trích xuất thuộc tính `cvFileKey` và chuyển đổi sang DTO `AdminMentorCvResponse`.
5. Trả về kết quả JSON chuẩn `ApiResponse<AdminMentorCvResponse>`.

**Function details**:
*   **Data**: `mentorProfileId`, `userId`, `mentorName`, `mentorEmail`, `avatarUrl`, `currentPosition`, `currentCompany`, `bio`, `cvFileKey`, `cvUrl`, `mentorStatus`, `supportedFields`.
*   **Validation**: Kiểm tra mã tệp CV `cvFileKey != null && !cvFileKey.isEmpty()`.
*   **Business rules**: **BR-96**: Chức năng Xem CV Mentor chỉ dùng cho mục đích kiểm tra đối chứng. Hệ thống KHÔNG cung cấp các thao tác Phê duyệt CV (Approve CV), Từ chối CV (Reject CV), Duyệt Mentor hoặc Từ chối Mentor. Trạng thái của Mentor hoàn toàn độc lập và được duy trì theo chu trình đăng ký gói dịch vụ.
*   **Error Handling**:
    - Trả về mã HTTP 403 Forbidden nếu người dùng không phải Admin.
    - Trả về mã HTTP 404 Not Found nếu không tìm thấy Mentor hoặc Mentor chưa tải CV.
*   **Normal case**: Trả về mã HTTP 200 OK bọc thông tin CV và hiển thị khung preview PDF trong `AdminMentorCvModal`.
*   **Abnormal case**: Hiển thị Banner cảnh báo lỗi màu đỏ trong Modal khi tệp không tồn tại hoặc lỗi kết nối.

---

### 5. Requirement Appendix (Phụ lục Yêu cầu)

#### 5.1 Business Rules (Quy tắc Nghiệp vụ)

| ID | Định nghĩa Quy tắc (Rule Definition) |
| :--- | :--- |
| **BR-96** | Xem CV Mentor (UC96) là tính năng chỉ đọc (Read-Only) dành riêng cho Quản trị viên. Tính năng này KHÔNG tạo ra quy trình duyệt/từ chối Mentor và KHÔNG thay đổi thuộc tính `mentorStatus` của bảng `mentor_profiles`. |

#### 5.3 Application Messages List (Danh sách Thông điệp Ứng dụng)

| # | Mã thông điệp | Loại thông điệp | Ngữ cảnh | Nội dung hiển thị |
| :--- | :--- | :--- | :--- | :--- |
| 1 | MSG_UC96_01 | Toast / Modal | Tải thông tin CV Mentor thành công | Tải CV Mentor thành công |
| 2 | MSG_UC96_02 | Inline Error | Không tìm thấy hồ sơ Mentor | Không tìm thấy hồ sơ Mentor với ID: {mentorId} |
| 3 | MSG_UC96_03 | Inline Error | Mentor chưa cập nhật tệp CV | Mentor này chưa cập nhật tệp CV lên hệ thống |
| 4 | MSG_UC96_04 | Alert Banner | Từ chối truy cập do thiếu quyền Admin | Access Denied: Người dùng không có quyền truy cập chức năng này |

---

## PHẦN 2: THIẾT KẾ CHI TIẾT (REPORT 4)

### 3. Detail Design (Thiết kế chi tiết)

#### 3.1 Xem CV Mentor (UC96 - Admin View Mentor CV)

##### 3.1.1 Class Diagram (Sơ đồ Lớp)

```mermaid
classDiagram
    %% Lớp Controller
    class AdminMentorCvController {
        -AdminMentorCvService adminMentorCvService
        +getMentorList(keyword, pageable) ResponseEntity~ApiResponse~PageResponse~AdminMentorCvResponse~~~
        +getMentorCv(mentorId) ResponseEntity~ApiResponse~AdminMentorCvResponse~~
    }
    
    %% Lớp Service Interface & Impl
    class AdminMentorCvService {
        <<interface>>
        +getMentorCv(mentorProfileId) AdminMentorCvResponse
        +getMentorList(keyword, pageable) PageResponse~AdminMentorCvResponse~
    }
    
    class AdminMentorCvServiceImpl {
        -MentorProfileRepository mentorProfileRepository
        -UserProfileRepository userProfileRepository
        -ExperienceRepository experienceRepository
        -MentorSupportedFieldRepository mentorSupportedFieldRepository
        +getMentorCv(mentorProfileId) AdminMentorCvResponse
        +getMentorList(keyword, pageable) PageResponse~AdminMentorCvResponse~
        -mapToAdminMentorCvResponse(profile) AdminMentorCvResponse
    }
    
    %% Lớp DTO
    class AdminMentorCvResponse {
        -Long mentorProfileId
        -Long userId
        -String mentorName
        -String mentorEmail
        -String avatarUrl
        -String currentPosition
        -String currentCompany
        -String bio
        -String cvFileKey
        -String cvUrl
        -MentorStatus mentorStatus
        -List~String~ supportedFields
        -Instant updatedAt
    }
    
    %% Lớp Repositories
    class MentorProfileRepository {
        <<interface>>
        +findByUserId(userId) Optional~MentorProfile~
        +existsByUserId(userId) boolean
    }
    
    class UserProfileRepository {
        <<interface>>
        +findById(userId) Optional~UserProfile~
    }
    
    class ExperienceRepository {
        <<interface>>
        +findByUserIdAndIsCurrentTrue(userId) List~Experience~
    }
    
    %% Lớp Entities
    class MentorProfile {
        -Long id
        -User user
        -String bio
        -String cvFileKey
        -MentorStatus mentorStatus
        -Instant updatedAt
    }
    
    class UserProfile {
        -Long userId
        -String fullName
        -String avatarUrl
    }
    
    %% Thiết lập mối quan hệ
    AdminMentorCvController --> AdminMentorCvService
    AdminMentorCvServiceImpl ..|> AdminMentorCvService
    AdminMentorCvServiceImpl --> MentorProfileRepository
    AdminMentorCvServiceImpl --> UserProfileRepository
    AdminMentorCvServiceImpl --> ExperienceRepository
    AdminMentorCvServiceImpl ..> AdminMentorCvResponse : creates
    MentorProfileRepository ..> MentorProfile : manages
    UserProfileRepository ..> UserProfile : manages
```

##### 3.1.2 Sequence Diagram (Sơ đồ Tuần tự Gộp duy nhất)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên (Admin)
    participant UI as AdminUsersPage / AdminMentorCvModal
    participant API as AdminMentorCvController
    participant Service as AdminMentorCvServiceImpl
    participant DB as PostgreSQL

    Admin->>UI: Nhấn nút "CV Mentor" trên danh sách người dùng
    UI->>API: GET /api/v1/admin/mentors/{mentorId}/cv (Bearer Token)
    
    alt Kiểm tra quyền Security Fail (Not ADMIN)
        API-->>UI: 403 Forbidden (Access Denied)
        UI-->>Admin: Hiển thị thông báo lỗi từ chối truy cập
    else Xác thực Admin thành công
        API->>Service: getMentorCv(mentorId)
        Service->>DB: SELECT * FROM mentor_profiles WHERE id = mentorId
        DB-->>Service: Khấu trừ bản ghi MentorProfile
        
        alt MentorProfile không tồn tại
            Service-->>API: Throw ResourceNotFoundException
            API-->>UI: 404 Not Found ("Không tìm thấy hồ sơ Mentor với ID")
            UI-->>Admin: Hiển thị cảnh báo không tìm thấy Mentor
        else MentorProfile tồn tại
            alt cvFileKey IS NULL hoặc Rỗng
                Service-->>API: Throw ResourceNotFoundException
                API-->>UI: 404 Not Found ("Mentor này chưa cập nhật tệp CV")
                UI-->>Admin: Hiển thị Banner "Mentor chưa tải tệp CV"
            else cvFileKey hợp lệ
                Service->>DB: Truy vấn UserProfile, Experience & SupportedFields
                DB-->>Service: Trả về thông tin cá nhân và chuyên môn
                Service-->>API: AdminMentorCvResponse DTO
                API-->>UI: 200 OK + ApiResponse<AdminMentorCvResponse>
                UI-->>Admin: Mở AdminMentorCvModal hiển thị iframe CV và nút Tải về
            end
        end
    end
```

##### Mô tả chi tiết sơ đồ tuần tự (Sequence Diagram Step Description):
1. **Quản trị viên** thực hiện thao tác nhấp vào nút **"CV Mentor"** tại màn hình Quản lý người dùng.
2. Frontend gửi một request `GET /api/v1/admin/mentors/{mentorId}/cv` kèm JWT Token chứa vai trò Admin.
3. **Phân nhánh 1 - Thiếu quyền Admin**: `AdminMentorCvController` đánh giá thông qua `@PreAuthorize`. Nếu không có vai trò `ADMIN`, trả về ngay lập tức HTTP 403 Forbidden.
4. **Phân nhánh 2 - Thiếu dữ liệu Mentor**: `AdminMentorCvServiceImpl` truy vấn bảng `mentor_profiles` trong CSDL PostgreSQL. Nếu không tìm thấy ID, ném ngoại lệ `ResourceNotFoundException` và trả về HTTP 404.
5. **Phân nhánh 3 - Thiếu tệp CV**: Nếu `cv_file_key` trong `mentor_profiles` bị rỗng hoặc NULL, trả về HTTP 404 Not Found thông báo Mentor chưa tải tệp CV.
6. **Phân nhánh 4 - Thành công**: Khi đầy đủ dữ liệu, hệ thống tổng hợp DTO `AdminMentorCvResponse` gửi về cho Client (HTTP 200 OK). Frontend hiển thị `AdminMentorCvModal` với tệp CV nhúng trực tiếp.

---

### 4. Database Design (Thiết kế Cơ sở dữ liệu)

#### 4.1 Bảng `mentor_profiles` (Bảng chính chứa thuộc tính CV)

| Cột (Column) | Kiểu dữ liệu (Data Type) | Nullable | Mô tả (Description) |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT GENERATED ALWAYS AS IDENTITY` | NO | Khóa chính |
| `user_id` | `BIGINT` | NO | FK liên kết bảng `users` (1-1) |
| `bio` | `TEXT` | YES | Lời giới thiệu cố vấn |
| `working_mode` | `VARCHAR(20)` | YES | ONLINE, OFFLINE, BOTH |
| `mentoring_type` | `VARCHAR(20)` | YES | INDIVIDUAL, GROUP, BOTH |
| `cv_file_key` | `VARCHAR(255)` | YES | Đường dẫn tệp CV của Mentor |
| `mentor_status` | `VARCHAR(20)` | NO | INCOMPLETE, PAYMENT_PENDING, ACTIVE, EXPIRED |
| `created_at` | `TIMESTAMPTZ` | NO | Thời điểm tạo hồ sơ |
| `updated_at` | `TIMESTAMPTZ` | NO | Thời điểm cập nhật gần nhất |

#### 4.2 Migration Script `V7__create_admin_mentor_cv_view_support.sql`

```sql
-- ==============================================================================
-- AlumNect Database Migration - Version 7
-- Feature: Module Quản trị viên - Xem CV Mentor (UC96 - Admin View Mentor CV)
-- Target DBMS: PostgreSQL 14+
-- ==============================================================================

-- Bổ sung Index hỗ trợ Admin truy vấn nhanh CV của Mentor theo mentor_profile_id và cv_file_key
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_cv_lookup ON mentor_profiles(id, cv_file_key) WHERE cv_file_key IS NOT NULL;
```
