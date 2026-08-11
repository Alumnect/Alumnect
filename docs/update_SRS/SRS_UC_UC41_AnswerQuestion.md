# ĐẶC TẢ YÊU CẦU & THIẾT KẾ CHI TIẾT: UC41 - TRẢ LỜI CÂU HỎI TRÊN DIỄN ĐÀN Q&A (ANSWER A QUESTION)

## PHẦN 1: ĐẶC TẢ NGHIỆP VỤ (REPORT 3)

### 2.2.3 Business Workflow (Luồng nghiệp vụ)

```mermaid
stateDiagram-v2
    [*] --> Xem_Chi_Tiet_Cau_Hoi : Người dùng mở trang chi tiết một câu hỏi
    Xem_Chi_Tiet_Cau_Hoi --> Tai_Danh_Sach_Tra_Loi : GET /questions/{id}/answers (công khai)
    Tai_Danh_Sach_Tra_Loi --> Mo_Form_Tra_Loi : Thành viên (STUDENT/ALUMNI) bấm ô "Viết câu trả lời"

    state Nhap_Tra_Loi {
        [*] --> Validate_Client
        Validate_Client --> Bao_Loi_Form : Nội dung trống / quá 10000 ký tự (Zod)
        Validate_Client --> Goi_API : Hợp lệ
    }
    Mo_Form_Tra_Loi --> Nhap_Tra_Loi
    Bao_Loi_Form --> Nhap_Tra_Loi

    Goi_API --> Validate_Server : POST /api/v1/questions/{id}/answers (Bearer JWT)

    state Validate_Server {
        [*] --> Kiem_Tra_Quyen
        Kiem_Tra_Quyen --> Bao_Loi_403 : Vai trò không phải STUDENT/ALUMNI
        Kiem_Tra_Quyen --> Kiem_Tra_Cau_Hoi : STUDENT/ALUMNI
        Kiem_Tra_Cau_Hoi --> Bao_Loi_404 : Câu hỏi không tồn tại / không ACTIVE
        Kiem_Tra_Cau_Hoi --> Luu_Tra_Loi : Hợp lệ
    }
    Bao_Loi_403 --> Nhap_Tra_Loi
    Bao_Loi_404 --> Nhap_Tra_Loi

    Luu_Tra_Loi --> Tang_Answer_Count : INSERT answers (ACTIVE, vote_count=0) + questions.answer_count += 1
    Tang_Answer_Count --> Tra_Ve_201 : Trả AnswerResponse
    Tra_Ve_201 --> Lam_Moi_Danh_Sach : FE invalidate cache ['answers'] + ['question']
    Lam_Moi_Danh_Sach --> [*] : Thu gọn form, câu trả lời mới hiển thị trong danh sách
```

#### Mô tả chi tiết luồng xử lý bằng chữ (Business Step Description):
* **Bước 1 - Xem câu hỏi & câu trả lời**: Bất kỳ ai (Guest/Student/Alumni) mở trang chi tiết một câu hỏi ACTIVE đều xem được danh sách câu trả lời (`GET /questions/{id}/answers`, công khai).
* **Bước 2 - Mở form & Nhập liệu**: Thành viên đã đăng nhập vai trò STUDENT/ALUMNI thấy ô "Viết câu trả lời"; bấm vào để mở form. Client kiểm tra bằng Zod (`createAnswerSchema`): nội dung bắt buộc ≤ 10000 ký tự.
* **Bước 3 - Gửi & Kiểm tra phía Server**: Client gọi `POST /questions/{id}/answers` kèm Bearer JWT. Server (`AnswerServiceImpl.createAnswer`):
  * Nạp User theo email (JWT); không tồn tại → 404.
  * Kiểm tra quyền: vai trò không phải STUDENT/ALUMNI → 403 (RBAC).
  * Kiểm tra câu hỏi tồn tại và ACTIVE; ẩn/xóa/không tồn tại → 404.
  * Lưu câu trả lời mới (status = ACTIVE, `vote_count = 0`) và **tăng `answer_count` của câu hỏi lên 1** (trong cùng transaction).
* **Bước 4 - Kết thúc**: Server trả HTTP 201 kèm câu trả lời vừa tạo. Frontend làm mới cache danh sách câu trả lời (`invalidateQueries(['answers'])`) và chi tiết câu hỏi (`['question']` — cập nhật số câu trả lời), thu gọn form; câu trả lời mới xuất hiện trong danh sách. Guest gọi API POST bị Spring Security chặn 401.

---

### 3.4 Module Diễn đàn Q&A: Câu trả lời
Module 4 (Q&A Forum) gồm: xem danh sách câu hỏi (UC38), xem chi tiết (UC39), đặt câu hỏi (UC40) và **trả lời câu hỏi (UC41)**. Câu trả lời gắn với một câu hỏi và một tác giả; hiển thị dưới câu hỏi theo thứ tự thời gian.

#### 3.4.1 Trả lời câu hỏi trên diễn đàn (Answer a question)

**Function trigger**:
*   **Navigation path**: `/app/forum/{id}` (chi tiết câu hỏi) → khu vực "Câu trả lời" → bấm ô "Viết câu trả lời của bạn…" để mở form.
*   **Timing Frequency**: On demand (khi thành viên muốn giải đáp một câu hỏi).

**Function description**:
*   **Actors/Roles**: Sinh viên (STUDENT), Cựu sinh viên (ALUMNI) — trả lời. Guest/Admin không có form trả lời (RBAC UI); Guest gọi API POST bị chặn 401, Admin bị chặn 403. Xem danh sách câu trả lời thì ai cũng được (công khai).
*   **Purpose**: Cho phép thành viên đăng câu trả lời cho một câu hỏi ACTIVE, xây dựng kho tri thức hỏi–đáp cho cộng đồng.
*   **Interface**:
    *   **Khu vực "Câu trả lời"** nằm CHUNG card với câu hỏi (như bài viết + bình luận): tiêu đề "Câu trả lời" + huy hiệu số câu trả lời thực tế.
    *   **Ô soạn thu gọn** (chỉ STUDENT/ALUMNI): avatar + "Viết câu trả lời của bạn…"; bấm vào bung form (textarea + đếm ký tự + nút Hủy/Gửi). Gửi thành công hoặc Hủy thì thu lại.
    *   **Danh sách câu trả lời**: mỗi câu trả lời dạng bong bóng (avatar + tên + headline + thời gian + nội dung), phân trang "Tải thêm".
    *   **Trạng thái**: loading (skeleton) / rỗng ("Chưa có câu trả lời nào…") / lỗi (Thử lại) / thành công; nút "Gửi" khóa khi đang gửi hoặc trống.

**Data processing**:
1.  Client tải danh sách câu trả lời qua `GET /questions/{id}/answers?page&size` (công khai).
2.  Client kiểm tra dữ liệu qua Zod (`createAnswerSchema`): nội dung bắt buộc ≤ 10000 ký tự.
3.  Client gọi `POST /questions/{id}/answers` (Bearer JWT tự đính) với `{ body }`.
4.  Server (`AnswerServiceImpl.createAnswer`, @Transactional): nạp User (404), RBAC (403), kiểm tra câu hỏi ACTIVE (404), lưu `Answer` (ACTIVE, vote=0), tăng `questions.answer_count`.
5.  Server map sang `AnswerResponse`, trả HTTP 201.
6.  Client `invalidateQueries(['answers'])` + `['question']` → danh sách & số câu trả lời tự cập nhật; form thu gọn.

**Screen layout**:
*   *Figure 1: Khu vực câu trả lời trong card chi tiết câu hỏi (ô soạn thu gọn + danh sách)*
*   *Figure 2: Form trả lời khi mở rộng (textarea + đếm ký tự + Hủy/Gửi)*
*   *Figure 3: Bong bóng câu trả lời sau khi gửi thành công*

**Function details**:
*   **Data**:
    *   `body` (String, bắt buộc, tối đa 10000 ký tự) — nội dung câu trả lời.
    *   *Trả về (AnswerResponse)*: `id, body, author, avatar, authorHeadline, verified, votes, time, createdAt`.
*   **Validation**:
    *   Phía Client (Zod): `body` bắt buộc ≤ 10000.
    *   Phía Server: `@NotBlank` + `@Size(max=10000)` cho `body` (JSR-380 trên `CreateAnswerRequest`).
*   **Business rules**: BR-AN-01 (RBAC: chỉ STUDENT/ALUMNI), BR-AN-02 (nội dung bắt buộc ≤ 10000), BR-AN-03 (câu hỏi phải tồn tại & ACTIVE), BR-AN-04 (khởi tạo ACTIVE, vote=0), BR-AN-05 (tăng answer_count của câu hỏi), BR-AN-06 (tác giả câu trả lời là người đang đăng nhập).
*   **Error Handling**:
    *   Nội dung trống → 400 (MSG-AN-01). Nội dung quá dài → 400 (MSG-AN-02).
    *   Câu hỏi không tồn tại/không ACTIVE → 404 (MSG-AN-03).
    *   Không phải STUDENT/ALUMNI → 403 (MSG-AN-04). Guest chưa đăng nhập → 401 (MSG-AN-05).
    *   Token hợp lệ nhưng không tìm thấy user → 404 (MSG-AN-06).
*   **Normal case**: Thành viên nhập nội dung hợp lệ, bấm "Gửi câu trả lời"; hệ thống lưu, trả 201 "Trả lời câu hỏi thành công"; form thu gọn, câu trả lời mới hiện trong danh sách, số câu trả lời tăng.
*   **Abnormal case**: Nội dung trống/quá dài → 400; câu hỏi không tồn tại/ẩn → 404; Admin/vai trò khác → 403; Guest → 401.

---

### 5. Requirement Appendix (Phụ lục Yêu cầu)

#### 5.1 Business Rules (Quy tắc Nghiệp vụ)

| ID | Định nghĩa Quy tắc (Rule Definition) |
| :--- | :--- |
| BR-AN-01 | Chỉ tài khoản đã đăng nhập với vai trò STUDENT hoặc ALUMNI mới được trả lời. Guest bị chặn (401), Admin/vai trò khác bị từ chối (403). |
| BR-AN-02 | Nội dung câu trả lời là bắt buộc và không vượt quá 10000 ký tự. |
| BR-AN-03 | Chỉ được trả lời câu hỏi đang tồn tại và ở trạng thái ACTIVE; câu hỏi ẩn/xóa/không tồn tại trả 404. |
| BR-AN-04 | Câu trả lời mới luôn khởi tạo với status = ACTIVE và vote_count = 0. |
| BR-AN-05 | Khi tạo câu trả lời thành công, số câu trả lời (answer_count) của câu hỏi tăng 1 (denormalized, trong cùng transaction). |
| BR-AN-06 | Câu trả lời được gắn tác giả (author_id) là chính người dùng đang đăng nhập (lấy từ JWT), không nhận author từ Client. |

#### 5.2 Common Requirements (Yêu cầu Chung)
*   Mọi thông điệp lỗi hiển thị cho người dùng đều bằng **Tiếng Việt**, lấy nguyên văn từ Backend.
*   Ô soạn câu trả lời chỉ hiển thị cho vai trò được phép (RBAC UI); Guest được mời đăng nhập.
*   Giao diện tuân thủ Warm Pastel Design System, responsive; câu hỏi và câu trả lời trình bày chung một card (bài viết + bình luận).
*   Toàn bộ giao tiếp client–server mã hóa qua HTTPS/TLS; token Bearer tự đính bởi interceptor.

#### 5.3 Application Messages List (Danh sách Thông điệp Ứng dụng)

| # | Mã thông điệp | Loại thông điệp | Ngữ cảnh | Nội dung hiển thị | HTTP |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | MSG-AN-01 | Inline (dưới ô) | Nội dung để trống | Nội dung câu trả lời không được để trống | 400 |
| 2 | MSG-AN-02 | Inline (dưới ô) | Nội dung vượt quá độ dài | Nội dung câu trả lời không được vượt quá 10000 ký tự | 400 |
| 3 | MSG-AN-03 | Banner (Alert error) | Câu hỏi không tồn tại/không ACTIVE | Không tìm thấy câu hỏi với id: {id} | 404 |
| 4 | MSG-AN-04 | Banner (Alert error) | Vai trò không được phép trả lời | Chỉ sinh viên và cựu sinh viên mới được trả lời câu hỏi | 403 |
| 5 | MSG-AN-05 | Chặn bởi Spring Security | Guest chưa đăng nhập | Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn. | 401 |
| 6 | MSG-AN-06 | Banner (Alert error) | Token hợp lệ nhưng tài khoản không tồn tại | Không tìm thấy tài khoản người dùng | 404 |
| 7 | MSG-AN-07 | API response (201) | Trả lời thành công (FE thu gọn form + hiện câu trả lời) | Trả lời câu hỏi thành công | 201 |

---

## PHẦN 2: THIẾT KẾ CHI TIẾT (REPORT 4)

### 3. Detail Design (Thiết kế chi tiết)

#### 3.1 Chức năng Trả lời câu hỏi (Answer a question)

##### 3.1.1 Class Diagram (Sơ đồ Lớp)

```mermaid
classDiagram
    class AnswerController {
        -AnswerService answerService
        +getAnswers(Long, int, int) ResponseEntity
        +createAnswer(Long, CreateAnswerRequest, Authentication) ResponseEntity
    }

    class CreateAnswerRequest {
        +String body
    }

    class AnswerResponse {
        +String id
        +String body
        +String author
        +String avatar
        +String authorHeadline
        +boolean verified
        +int votes
        +String time
        +String createdAt
    }

    class AnswerService {
        <<interface>>
        +getAnswers(Long, int, int) PageResponse
        +createAnswer(String, Long, CreateAnswerRequest) AnswerResponse
    }

    class AnswerServiceImpl {
        -AnswerRepository answerRepository
        -QuestionRepository questionRepository
        -UserRepository userRepository
        -UserProfileRepository userProfileRepository
        -AnswerMapper answerMapper
        +getAnswers(Long, int, int) PageResponse
        +createAnswer(String, Long, CreateAnswerRequest) AnswerResponse
    }

    class AnswerMapper {
        +toResponse(Answer, UserProfile) AnswerResponse
    }

    class AnswerRepository {
        <<interface>>
        +findActiveByQuestionId(Long, Pageable) Page
        +save(Answer) Answer
    }

    class QuestionRepository {
        <<interface>>
        +findActiveDetailById(Long) Optional
        +save(Question) Question
    }

    class Answer {
        +Long id
        +Question question
        +User author
        +String body
        +AnswerStatus status
        +int voteCount
        +Instant createdAt
        +Instant updatedAt
    }

    class Question {
        +Long id
        +int answerCount
    }

    AnswerController ..> CreateAnswerRequest : validates & uses
    AnswerController --> AnswerService : calls
    AnswerController ..> AnswerResponse : returns
    AnswerServiceImpl ..|> AnswerService : implements
    AnswerServiceImpl --> AnswerRepository : uses
    AnswerServiceImpl --> QuestionRepository : uses (validate + tăng answer_count)
    AnswerServiceImpl --> UserRepository : uses
    AnswerServiceImpl --> AnswerMapper : uses
    AnswerServiceImpl --> Answer : manipulates
    AnswerMapper ..> Answer : reads
    AnswerMapper ..> AnswerResponse : builds
    AnswerRepository --> Answer : manages
    Answer --> Question : belongs to
```

###### Mô tả chi tiết cấu trúc các lớp (Class Design Description):
* **AnswerController**: Map `/api/v1/questions/{questionId}/answers`. `GET` (công khai) trả trang câu trả lời; `POST` (đã `@Valid`, lấy email từ `Authentication`) tạo câu trả lời, trả HTTP 201 kèm `AnswerResponse`.
* **CreateAnswerRequest (DTO)**: Trường `body` (@NotBlank, @Size max 10000); message validation Tiếng Việt.
* **AnswerResponse (DTO)**: Cấu trúc phẳng khớp schema Zod `answerSchema` phía Frontend.
* **AnswerService / AnswerServiceImpl**: `getAnswers` (xác thực câu hỏi ACTIVE → truy vấn câu trả lời ACTIVE, batch hồ sơ tác giả, map). `createAnswer` (@Transactional): nạp User (404), RBAC (403), xác thực câu hỏi ACTIVE (404), lưu Answer, tăng `answer_count`, map response.
* **AnswerMapper**: `@Component` ghép `Answer` + `UserProfile` tác giả thành `AnswerResponse` (thời gian tương đối, tên/avatar/headline/verified).
* **AnswerRepository / QuestionRepository / UserRepository**: Spring Data JPA — `findActiveByQuestionId`, `save(Answer)`; `findActiveDetailById`, `save(Question)`; `findByEmail`.
* **Answer / Question (Entity)**: Ánh xạ bảng `answers`/`questions`. `Answer` mặc định status=ACTIVE, vote=0.

##### 3.1.2 Sequence Diagram (Sơ đồ Tuần tự — luồng tạo câu trả lời)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend / Client
    participant Ctrl as AnswerController (@Valid)
    participant Service as AnswerServiceImpl
    participant UserRepo as UserRepository
    participant QRepo as QuestionRepository
    participant Mapper as AnswerMapper
    participant ARepo as AnswerRepository
    participant DB as PostgreSQL

    Note over Client, Ctrl: Guest chưa đăng nhập bị Spring Security chặn 401 trước khi vào Controller
    Client->>Ctrl: HTTP POST /questions/{id}/answers (CreateAnswerRequest, Bearer JWT)

    alt Trường hợp 1: Validate đầu vào thất bại (JSR-380)
        Note over Ctrl: body trống hoặc quá 10000 ký tự
        Ctrl-->>Client: HTTP 400 Bad Request (ApiResponse chi tiết lỗi trường)

    else Trường hợp 2: Dữ liệu hợp lệ
        Ctrl->>Service: createAnswer(email, questionId, request)
        Service->>UserRepo: findByEmail(email)
        UserRepo-->>Service: User (kèm role)

        alt Trường hợp 2.1: Không tìm thấy tài khoản
            Service-->>Ctrl: Throw ResourceNotFoundException("Không tìm thấy tài khoản người dùng")
            Ctrl-->>Client: HTTP 404 Not Found
        else Trường hợp 2.2: Vai trò không phải STUDENT/ALUMNI
            Service-->>Ctrl: Throw ForbiddenException("Chỉ sinh viên và cựu sinh viên mới được trả lời câu hỏi")
            Ctrl-->>Client: HTTP 403 Forbidden
        else Trường hợp 2.3: Câu hỏi không tồn tại / không ACTIVE
            Service->>QRepo: findActiveDetailById(questionId)
            QRepo-->>Service: (rỗng)
            Service-->>Ctrl: Throw ResourceNotFoundException("Không tìm thấy câu hỏi với id: ...")
            Ctrl-->>Client: HTTP 404 Not Found
        else Trường hợp 2.4: Hợp lệ (Thành công)
            Note over Service: Dựng Answer (ACTIVE, vote=0, gắn question + author)
            Service->>ARepo: save(answer)
            ARepo->>DB: INSERT INTO answers (...)
            DB-->>ARepo: Answer đã lưu
            Service->>QRepo: save(question) — answer_count += 1
            QRepo->>DB: UPDATE questions SET answer_count = answer_count + 1
            Service->>Mapper: toResponse(answer, authorProfile)
            Mapper-->>Service: AnswerResponse
            Service-->>Ctrl: AnswerResponse
            Ctrl-->>Client: HTTP 201 Created (ApiResponse "Trả lời câu hỏi thành công")
            Note over Client: invalidate cache ['answers'] + ['question'] → cập nhật danh sách & số câu trả lời
        end
    end
```

###### Mô tả chi tiết luồng xử lý bằng chữ (Sequence Flow Description):
1.  **Luồng thành công (Normal Case)**: Client gửi `POST /questions/{id}/answers` kèm Bearer JWT và DTO hợp lệ. Controller gọi `AnswerServiceImpl.createAnswer`. Service nạp User, xác nhận STUDENT/ALUMNI, xác nhận câu hỏi ACTIVE, dựng và lưu `Answer` (ACTIVE, vote=0), tăng `answer_count`, map `AnswerResponse`. Controller trả HTTP 201 "Trả lời câu hỏi thành công". Frontend làm mới cache và thu gọn form.
2.  **Luồng lỗi Validation (400)**: `body` trống hoặc vượt 10000 ký tự → `MethodArgumentNotValidException` → GlobalExceptionHandler trả 400.
3.  **Luồng lỗi RBAC (403)**: Vai trò không phải STUDENT/ALUMNI → `ForbiddenException` → 403. Guest bị Spring Security chặn 401 trước Controller.
4.  **Luồng lỗi Không tìm thấy (404)**: Không tìm thấy user, hoặc câu hỏi không tồn tại/không ACTIVE → `ResourceNotFoundException` → 404.
