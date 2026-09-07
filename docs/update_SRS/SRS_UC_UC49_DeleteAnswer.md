# ĐẶC TẢ YÊU CẦU & THIẾT KẾ CHI TIẾT: UC49 - XÓA CÂU TRẢ LỜI TRÊN DIỄN ĐÀN Q&A (DELETE AN ANSWER)

## PHẦN 1: ĐẶC TẢ NGHIỆP VỤ (REPORT 3)

### 2.2.3 Business Workflow (Luồng nghiệp vụ)

```mermaid
stateDiagram-v2
    [*] --> Xem_Cau_Tra_Loi : Tác giả xem câu trả lời/reply của chính mình
    Xem_Cau_Tra_Loi --> Hien_Nut_Xoa : FE so khớp authorId == người đăng nhập
    Hien_Nut_Xoa --> Mo_Modal_Xac_Nhan : Bấm "Xóa" → mở modal cảnh báo

    Mo_Modal_Xac_Nhan --> Huy : Bấm "Hủy" → đóng modal, không đổi gì
    Mo_Modal_Xac_Nhan --> Goi_API : Bấm "Xóa" (xác nhận)

    Goi_API --> Kiem_Tra_Server : DELETE /questions/{qId}/answers/{aId} (Bearer JWT)

    state Kiem_Tra_Server {
        [*] --> Kiem_Tra_Cau_Tra_Loi
        Kiem_Tra_Cau_Tra_Loi --> Bao_Loi_404 : answerId không tồn tại/không ACTIVE/khác questionId
        Kiem_Tra_Cau_Tra_Loi --> Kiem_Tra_So_Huu : Tồn tại, đúng câu hỏi
        Kiem_Tra_So_Huu --> Bao_Loi_403 : Không phải tác giả
        Kiem_Tra_So_Huu --> Don_Vote : Là tác giả
        Don_Vote --> Xoa_Cung : DELETE votes (answer + reply trực tiếp nếu là gốc) — votes không FK nên không tự cascade
        Xoa_Cung --> Kiem_Tra_Cap : DELETE FROM answers WHERE id=aId (reply tự xóa theo DB CASCADE parent_id)
        Kiem_Tra_Cap --> Giam_Dem : Là câu trả lời GỐC (parent = null) → answer_count - 1
        Kiem_Tra_Cap --> Tra_Ve_200 : Là reply → không đổi answer_count
        Giam_Dem --> Tra_Ve_200
    }

    Bao_Loi_403 --> Hien_Thi_Loi_Toast : Toast lỗi (banner trong modal)
    Bao_Loi_404 --> Hien_Thi_Loi_Toast
    Tra_Ve_200 --> Lam_Moi_Cache : FE invalidate ['answers', qId] + ['question', qId]
    Lam_Moi_Cache --> Dong_Modal : Câu trả lời/reply biến mất khỏi luồng, toast thành công
    Dong_Modal --> [*]
    Hien_Thi_Loi_Toast --> [*]
    Huy --> [*]
```

#### Mô tả chi tiết luồng xử lý bằng chữ (Business Step Description):
* **Bước 1 - Hiển thị nút Xóa**: Trong khu vực câu trả lời (`AnswersSection`) dưới trang chi tiết câu hỏi, mỗi bong bóng câu trả lời/reply so khớp `authorId` với người đang đăng nhập; chỉ **chính tác giả** mới thấy nút "Xóa" (cạnh "Chỉnh sửa" — UC48, và "Trả lời"). Áp dụng đồng nhất cho cả câu trả lời GỐC và REPLY.
* **Bước 2 - Xác nhận**: Bấm "Xóa" mở modal cảnh báo "Bạn có chắc muốn xóa câu trả lời này không?". Người dùng "Hủy" (đóng modal, không đổi gì) hoặc "Xóa" để xác nhận.
* **Bước 3 - Gửi & Kiểm tra phía Server**: Client gọi `DELETE /questions/{questionId}/answers/{answerId}` kèm Bearer JWT. Server (`AnswerServiceImpl.deleteAnswer`, `@Transactional`):
  * Nạp User theo email (JWT); không tồn tại → 404.
  * Tìm câu trả lời ACTIVE theo `answerId`, xác nhận thuộc đúng `questionId` (tái dùng helper `findActiveAnswerInQuestion` đã có từ UC43) — không tồn tại/không ACTIVE/khác câu hỏi → 404.
  * **Kiểm tra quyền sở hữu**: `answer.author.id` khác người đăng nhập → 403.
  * **Dọn lượt bình chọn (`votes`) trước**: nếu là câu trả lời GỐC, gom thêm ID các reply trực tiếp (ACTIVE) của nó; xóa toàn bộ bản ghi `votes` có `target_type='ANSWER'` và `target_id` thuộc tập ID vừa gom — bảng `votes` là đa hình, **không có FK cứng** tới `answers` nên không tự dọn theo khi xóa cứng câu trả lời.
  * **Xóa CỨNG** câu trả lời (`answerRepository.delete(answer)`) — nếu là câu trả lời gốc, các reply trực tiếp **tự động bị xóa theo** nhờ ràng buộc DB `answers.parent_id ... ON DELETE CASCADE` (đã có sẵn từ V1).
  * **Nếu là câu trả lời GỐC**: giảm `question.answer_count` đi 1 (không âm) — đối xứng với lúc tạo (UC41 chỉ tăng bộ đếm cho câu trả lời gốc). **Nếu là REPLY**: không đổi bộ đếm.
* **Bước 4 - Kết thúc**: Server trả HTTP 200 (không payload). Frontend hiển thị toast thành công, làm mới cache danh sách câu trả lời (`['answers', questionId]`) và chi tiết câu hỏi (`['question', questionId]`) để cập nhật số câu trả lời hiển thị. Guest gọi API DELETE bị Spring Security chặn 401 trước Controller.

---

### 3.8 Module Diễn đàn Q&A: Xóa câu trả lời
Module 4 (Q&A Forum). UC49 hoàn thiện vòng đời CRUD của câu trả lời (UC41 tạo, UC48 sửa, UC49 xóa). Xóa **cứng** (hard delete) — nhất quán với cách `PostServiceImpl.deleteComment` (UC20) xử lý bình luận, vì Answer đóng vai trò "phản hồi dưới nội dung chính" giống Comment, khác với Question/Post (nội dung chính) vốn xóa **mềm** (UC47/UC23) để giữ lịch sử. Đây là quy ước đã thống nhất trong toàn hệ thống: **nội dung chính xóa mềm, phản hồi/bình luận xóa cứng**.

#### 3.8.1 Xóa câu trả lời (Delete an answer)

**Function trigger**:
*   **Navigation path**: `/app/forum/{id}` (chi tiết câu hỏi) → khu vực "Câu trả lời" → nút "Xóa" (chỉ tác giả) trên câu trả lời/reply của chính mình → modal xác nhận → "Xóa".
*   **Timing Frequency**: On demand (khi tác giả muốn gỡ bỏ câu trả lời/reply đã đăng).

**Function description**:
*   **Actors/Roles**: Sinh viên (STUDENT), Cựu sinh viên (ALUMNI) — nhưng **chỉ tác giả** của câu trả lời/reply đó. Người khác (kể cả Student/Alumni khác) không thấy nút Xóa và bị API từ chối 403; Guest bị chặn 401.
*   **Purpose**: Cho phép tác giả tự gỡ bỏ vĩnh viễn câu trả lời hoặc reply của mình (VD trả lời nhầm, không còn chính xác, muốn rút lại).
*   **Interface**:
    *   **Nút "Xóa"** (text link, đổi màu đỏ khi hover) nằm trong hàng hành động của mỗi câu trả lời/reply, cạnh "Trả lời"/"Chỉnh sửa" — chỉ hiện với chính tác giả bong bóng đó.
    *   **Modal xác nhận**: tiêu đề "Xóa câu trả lời", icon cảnh báo đỏ, nội dung "Bạn có chắc muốn xóa câu trả lời này không?", 2 nút "Hủy"/"Xóa" (đỏ, có spinner khi xử lý). Nhấn mạnh tính **không thể hoàn tác** vì là xóa cứng.
    *   **Thông báo**: toast thành công "Đã xóa câu trả lời thành công" hoặc toast lỗi nếu API thất bại.

**Data processing**:
1.  Client gọi `DELETE /questions/{questionId}/answers/{answerId}` (Bearer JWT), không có request body.
2.  Server (`AnswerServiceImpl.deleteAnswer`, `@Transactional`): nạp User (404), tìm câu trả lời ACTIVE đúng câu hỏi (404, tái dùng `findActiveAnswerInQuestion`), kiểm tra sở hữu (403), dọn `votes` liên quan (answer + reply trực tiếp nếu là gốc), **xóa cứng** bản ghi (`DELETE FROM answers`) — DB tự cascade xóa reply nếu là câu trả lời gốc; nếu là câu trả lời gốc thì giảm `question.answer_count`.
3.  Server trả HTTP 200 `ApiResponse<Void>`.
4.  Client hiện toast, `invalidateQueries(['answers', questionId])` + `['question', questionId])` → câu trả lời/reply biến mất vĩnh viễn khỏi luồng, số "Câu trả lời" trên đầu khu vực tự cập nhật đúng nếu xóa câu trả lời gốc.

**Screen layout**:
*   *Figure 1: Nút "Xóa" trong hàng hành động của câu trả lời/reply (chỉ tác giả).*
*   *Figure 2: Modal xác nhận xóa câu trả lời.*

**Function details**:
*   **Data**:
    *   Tham số đầu vào: `questionId`, `answerId` (Long, path variable) — không có request body.
    *   Trả về: `ApiResponse<Void>` — không có payload dữ liệu.
*   **Validation**: Không có validate dữ liệu đầu vào — chỉ kiểm tra tồn tại/đúng câu hỏi + quyền sở hữu ở tầng nghiệp vụ.
*   **Business rules**: Xem mục 5.1 (BR-DA-01 → BR-DA-07).
*   **Error Handling**:
    *   Câu trả lời không tồn tại/không ACTIVE/khác câu hỏi (kể cả xóa 2 lần) → 404 (MSG-DA-01).
    *   Không phải tác giả → 403 (MSG-DA-02).
    *   Guest chưa đăng nhập → 401, chặn bởi Spring Security trước Controller (MSG-DA-03).
*   **Normal case**: Tác giả xác nhận xóa câu trả lời/reply của mình; hệ thống xóa cứng bản ghi (+ reply trực tiếp nếu là gốc), dọn vote liên quan, đối xứng giảm `answer_count` nếu là câu trả lời gốc, trả 200; toast thành công, câu trả lời biến mất khỏi luồng.
*   **Abnormal case**: Không phải tác giả → 403; câu trả lời đã xóa/không tồn tại/khác câu hỏi → 404; Guest → 401.

---

### 5. Requirement Appendix (Phụ lục Yêu cầu)

#### 5.1 Business Rules (Quy tắc Nghiệp vụ)

| ID | Định nghĩa Quy tắc (Rule Definition) |
| :--- | :--- |
| BR-DA-01 | Chỉ **chính tác giả** của câu trả lời/reply mới được xóa; người khác (kể cả STUDENT/ALUMNI khác) bị từ chối 403. |
| BR-DA-02 | Chỉ xóa được câu trả lời đang tồn tại, ở trạng thái ACTIVE, và thuộc đúng `questionId` trên đường dẫn; sai một trong ba điều kiện đều trả 404 như nhau (không phân biệt lý do, tránh lộ thông tin). |
| BR-DA-03 | Xóa là **xóa cứng** (`DELETE FROM answers`, KHÔNG phải đổi status) — nhất quán với `deleteComment` (UC20). Xóa một câu trả lời GỐC làm reply trực tiếp của nó **bị xóa cứng theo** (DB cascade qua `answers.parent_id ... ON DELETE CASCADE`, có sẵn từ V1) — không xóa đệ quy tiếp reply-của-reply vì mô hình chỉ 2 cấp (UC41). |
| BR-DA-04 | Trước khi xóa cứng câu trả lời, phải **dọn tường minh** các bản ghi `votes` (`target_type='ANSWER'`) trỏ tới câu trả lời đó (và các reply trực tiếp bị cascade xóa theo nếu là gốc) — vì `votes.target_id` là cột đa hình, **không có FK** tới `answers`, xóa cứng answer không tự dọn vote theo, nếu bỏ qua bước này sẽ để lại vote "mồ côi" (trỏ tới answerId không còn tồn tại). |
| BR-DA-05 | Xóa câu trả lời **GỐC** (`parent = null`) làm giảm `questions.answer_count` đi 1 (không âm) — đối xứng với UC41 (chỉ tăng bộ đếm khi tạo câu trả lời gốc). Xóa **REPLY** không đổi `answer_count` (đối xứng với việc tạo reply cũng không tăng bộ đếm). Bộ đếm chỉ trừ 1 cho chính câu trả lời gốc, KHÔNG trừ thêm cho số reply bị cascade xóa theo (reply chưa từng được tính vào bộ đếm này). |
| BR-DA-06 | Áp dụng đồng nhất cho **cả câu trả lời gốc lẫn reply** — cùng một endpoint, cùng logic kiểm tra sở hữu. |
| BR-DA-07 | Chức năng yêu cầu đăng nhập với vai trò STUDENT/ALUMNI; Guest bị chặn 401 (endpoint không nằm `PUBLIC_GET`). |

#### 5.2 Common Requirements (Yêu cầu Chung)
*   Mọi thông điệp lỗi/thành công hiển thị cho người dùng đều bằng **Tiếng Việt**, qua hệ thống toast dùng chung (`@/components/ui/Toast`).
*   Nút "Xóa" chỉ hiển thị cho tác giả (RBAC UI dựa trên `authorId`); Backend luôn kiểm tra lại quyền sở hữu (không tin Client).
*   Hành động xóa là **destructive và KHÔNG THỂ HOÀN TÁC** (xóa cứng, không có tính năng khôi phục) → bắt buộc modal xác nhận trước khi gọi API.
*   Không tạo migration mới — ràng buộc `answers.parent_id ... ON DELETE CASCADE` đã có sẵn từ V1 (UC41); chỉ thêm 1 method repository mới (`VoteRepository.deleteByTargetTypeAndTargetIdIn`) ở tầng code, không đổi schema.

#### 5.3 Application Messages List (Danh sách Thông điệp Ứng dụng)

| # | Mã thông điệp | Loại thông điệp | Ngữ cảnh | Nội dung hiển thị | HTTP |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | MSG-DA-01 | Toast lỗi | Câu trả lời không tồn tại/không ACTIVE/khác câu hỏi | Không tìm thấy câu trả lời với id: {id} | 404 |
| 2 | MSG-DA-02 | Toast lỗi | Không phải tác giả | Chỉ tác giả mới được xóa câu trả lời này | 403 |
| 3 | MSG-DA-03 | Chặn bởi Spring Security | Guest chưa đăng nhập | Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn. | 401 |
| 4 | MSG-DA-04 | Toast thành công | Xóa thành công | Đã xóa câu trả lời thành công | 200 |

---

## PHẦN 2: THIẾT KẾ CHI TIẾT (REPORT 4)

### 3. Detail Design (Thiết kế chi tiết)

#### 3.1 Chức năng Xóa câu trả lời (Delete an answer)

##### 3.1.1 Class Diagram (Sơ đồ Lớp)

```mermaid
classDiagram
    class AnswerController {
        -AnswerService answerService
        +updateAnswer(Long, Long, UpdateAnswerRequest, Authentication) ResponseEntity
        +deleteAnswer(Long, Long, Authentication) ResponseEntity
    }

    class AnswerService {
        <<interface>>
        +deleteAnswer(String, Long, Long) void
    }

    class AnswerServiceImpl {
        -AnswerRepository answerRepository
        -QuestionRepository questionRepository
        -VoteRepository voteRepository
        -UserRepository userRepository
        +deleteAnswer(String, Long, Long) void
        -findActiveAnswerInQuestion(Long, Long) Answer
    }

    class AnswerRepository {
        <<interface>>
        +findById(Long) Optional~Answer~
        +findActiveRepliesByParentIds(List~Long~) List~Answer~
        +delete(Answer) void
    }

    class VoteRepository {
        <<interface>>
        +deleteByTargetTypeAndTargetIdIn(VoteTargetType, List~Long~) void
    }

    class Answer {
        +Long id
        +Question question
        +Answer parent
        +User author
        +AnswerStatus status
    }

    class Question {
        +Long id
        +int answerCount
    }

    AnswerController --> AnswerService : gọi nghiệp vụ
    AnswerServiceImpl ..|> AnswerService : triển khai
    AnswerServiceImpl --> AnswerRepository : nạp + xóa cứng câu trả lời
    AnswerServiceImpl --> VoteRepository : dọn vote mồ côi trước khi xóa
    AnswerServiceImpl --> QuestionRepository : cập nhật answer_count
    AnswerRepository ..> Answer : trả về
    Answer --> Question : thuộc về
    note for Answer "answers.parent_id ... ON DELETE CASCADE\n(DB tự xóa reply khi xóa câu trả lời gốc)"
```

###### Mô tả chi tiết cấu trúc các lớp (Class Design Description):
* **Lớp Controller (`AnswerController`)**: Bổ sung `DELETE /api/v1/questions/{questionId}/answers/{answerId}` (lấy email từ `Authentication`) → gọi `deleteAnswer`, trả HTTP 200 kèm `ApiResponse<Void>`. Endpoint không nằm `PUBLIC_GET` nên tự động yêu cầu JWT — không cần sửa `Endpoints.java`/`SecurityConfig`.
* **Lớp Service (`AnswerService`, `AnswerServiceImpl`)**: `deleteAnswer` (`@Transactional`): nạp User (404), **tái sử dụng nguyên** helper `findActiveAnswerInQuestion` đã tạo từ UC43 (Vote on an answer) để tìm + validate câu trả lời (404), kiểm tra sở hữu (403); nếu là câu trả lời gốc thì gọi thêm `findActiveRepliesByParentIds` (đã có từ UC41) để lấy ID các reply trực tiếp; gọi `VoteRepository.deleteByTargetTypeAndTargetIdIn` (mới) dọn vote của answer + reply; `answerRepository.delete(answer)` xóa cứng (DB cascade xóa reply); nếu `answer.parent == null` thì giảm `question.answerCount`.
* **Lớp Repository (`VoteRepository`)**: Bổ sung 1 method mới `deleteByTargetTypeAndTargetIdIn(VoteTargetType, List<Long>)` — Spring Data tự sinh câu lệnh DELETE theo tên hàm, không cần `@Query` thủ công.
* **Lớp Repository & Entity khác**: Tái sử dụng nguyên `AnswerRepository.findById`/`findActiveRepliesByParentIds`/`delete` (đã có từ UC41/UC48) và `Answer`/`Question` — **không tạo migration**; ràng buộc `answers.parent_id ... ON DELETE CASCADE` đã tồn tại sẵn từ V1, giờ mới thực sự "kích hoạt" tác dụng cascade khi UC49 lần đầu gọi xóa cứng lên bảng `answers`.

##### 3.1.2 Sequence Diagram (Sơ đồ Tuần tự)

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend / Client
    participant Ctrl as AnswerController
    participant Service as AnswerServiceImpl
    participant UserRepo as UserRepository
    participant ARepo as AnswerRepository
    participant VRepo as VoteRepository
    participant QRepo as QuestionRepository
    participant DB as PostgreSQL

    Note over Client, Ctrl: Guest chưa đăng nhập bị Spring Security chặn 401 trước Controller
    Client->>Ctrl: HTTP DELETE /questions/{qId}/answers/{aId} (Bearer JWT)
    Ctrl->>Service: deleteAnswer(email, questionId, answerId)
    Service->>UserRepo: findByEmail(email)
    UserRepo-->>Service: User

    alt Trường hợp 1: answerId không tồn tại/không ACTIVE/khác câu hỏi
        Service->>ARepo: findById(answerId)
        ARepo-->>Service: (rỗng hoặc question_id khác questionId)
        Service-->>Ctrl: ResourceNotFoundException -> HTTP 404
    else Trường hợp 2: Không phải tác giả
        Service->>ARepo: findById(answerId) -> khớp questionId, ACTIVE
        ARepo-->>Service: Answer
        Note over Service: answer.author.id != user.id
        Service-->>Ctrl: ForbiddenException("Chỉ tác giả mới được xóa câu trả lời này") -> HTTP 403
    else Trường hợp 3: Hợp lệ, là câu trả lời GỐC (Thành công)
        Service->>ARepo: findById(answerId) -> khớp questionId, ACTIVE
        ARepo-->>Service: Answer (parent = null)
        Service->>ARepo: findActiveRepliesByParentIds([answerId])
        ARepo-->>Service: List<Answer> replies
        Service->>VRepo: deleteByTargetTypeAndTargetIdIn(ANSWER, [answerId, ...replyIds])
        VRepo->>DB: DELETE FROM votes WHERE target_type='ANSWER' AND target_id IN (...)
        Service->>ARepo: delete(answer)
        ARepo->>DB: DELETE FROM answers WHERE id=? (CASCADE tự xóa reply theo parent_id)
        Service->>QRepo: question.setAnswerCount(-1); save(question)
        QRepo->>DB: UPDATE questions SET answer_count = answer_count - 1
        Service-->>Ctrl: void
        Ctrl-->>Client: HTTP 200 OK (ApiResponse "Xóa câu trả lời thành công")
        Note over Client: invalidate ['answers', qId] + ['question', qId] -> toast, câu trả lời + reply biến mất
    else Trường hợp 4: Hợp lệ, là REPLY (Thành công, không đổi answer_count)
        Service->>ARepo: findById(answerId) -> khớp questionId, ACTIVE
        ARepo-->>Service: Answer (parent != null)
        Service->>VRepo: deleteByTargetTypeAndTargetIdIn(ANSWER, [answerId])
        VRepo->>DB: DELETE FROM votes WHERE target_type='ANSWER' AND target_id=?
        Service->>ARepo: delete(answer)
        ARepo->>DB: DELETE FROM answers WHERE id=?
        Note over Service: parent != null -> KHÔNG đổi answer_count
        Service-->>Ctrl: void
        Ctrl-->>Client: HTTP 200 OK
    end
```

###### Mô tả chi tiết luồng xử lý bằng chữ (Sequence Flow Description):
1.  **Luồng thành công — câu trả lời GỐC**: Client gửi `DELETE /questions/{qId}/answers/{aId}`. Service nạp User, tìm câu trả lời ACTIVE đúng câu hỏi, xác nhận sở hữu, lấy ID các reply trực tiếp, dọn `votes` của cả câu trả lời và reply, **xóa cứng** câu trả lời (reply tự bị xóa theo qua DB CASCADE), giảm `question.answer_count` đi 1. Trả HTTP 200.
2.  **Luồng thành công — REPLY**: Giống trên nhưng không cần gom reply-của-reply (mô hình chỉ 2 cấp), chỉ dọn vote của chính reply đó rồi xóa cứng; `parent != null` nên **không** đổi `answer_count`.
3.  **Luồng lỗi Không tìm thấy (404)**: `answerId` không tồn tại, không ACTIVE, hoặc thuộc `questionId` khác trên đường dẫn (kể cả gọi xóa 2 lần liên tiếp cùng id — lần 2 không tìm thấy vì đã xóa cứng thật) → `ResourceNotFoundException`.
4.  **Luồng lỗi Quyền sở hữu (403)**: `answer.author.id` khác người đăng nhập → `ForbiddenException`. Guest bị Spring Security chặn 401 trước Controller, không tới được Service.

### 4. Kết quả kiểm thử thực tế (Manual QA — DB level)
Đã verify trực tiếp bằng transaction thử nghiệm trên DB thật (tạo dữ liệu test, chạy đúng thứ tự lệnh của `deleteAnswer`, `ROLLBACK` để không đổi data thật):

| Kịch bản | Kết quả |
| :--- | :--- |
| Xóa câu trả lời GỐC có 1 reply, cả 2 đều có vote | Sau `DELETE FROM answers WHERE id=<gốc>`: cả câu trả lời gốc VÀ reply đều biến mất khỏi bảng `answers` (CASCADE hoạt động đúng) |
| Vote của câu trả lời gốc + reply (dọn trước khi xóa answer) | Sau khi dọn: 0 bản ghi `votes` mồ côi trỏ tới 2 answerId đã xóa — không còn dữ liệu rác |
| Vote của các câu trả lời KHÁC (không liên quan) | Không bị ảnh hưởng — vẫn còn nguyên, xác nhận `deleteByTargetTypeAndTargetIdIn` chỉ xóa đúng tập ID chỉ định |
