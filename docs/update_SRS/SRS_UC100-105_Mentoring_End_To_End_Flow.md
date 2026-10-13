# ĐẶC TẢ YÊU CẦU & THIẾT KẾ CHI TIẾT: UC100 – UC105 - CHUỖI NGHIỆP VỤ MENTORING END-TO-END (REQUEST → RESPONSE → CHAT FOR TASK → DEAL → PAYMENT → TASK)

> Tài liệu được viết theo **mã nguồn thực tế** sau migration `V21__link_mentoring_request_deal_payment_task_flow.sql`.
> Khi có khác biệt với SRS riêng lẻ của UC103 / UC104 / UC105, **tài liệu này là nguồn sự thật** cho phần liên kết giữa các UC.

## PHẦN 1: ĐẶC TẢ NGHIỆP VỤ (REPORT 3)

### 2.2.3 Business Workflow (Luồng nghiệp vụ)

```mermaid
stateDiagram-v2
    [*] --> REQUEST_OPEN : Học viên tạo Request (UC100 chung / UC101 trực tiếp)
    REQUEST_OPEN --> REQUEST_OPEN : Mentor DECLINE (phản hồi DECLINED)
    REQUEST_OPEN --> NEGOTIATING : Mentor ACCEPT → tạo/lấy lại Chat for Task (task_id = null)
    NEGOTIATING --> NEGOTIATING : Mentor gửi Deal Ticket vN (Chấp nhận theo Request / Deal lại)
    NEGOTIATING --> NEGOTIATING : Học viên Yêu cầu điều chỉnh (vN → SUPERSEDED) / Từ chối (REJECTED)
    NEGOTIATING --> MATCHED : Học viên xác nhận đúng phiên bản mới nhất → Deal khóa, chọn Mentor
    MATCHED --> MATCHED : Thanh toán FAILED / EXPIRED / CANCELLED → giữ Mentor & Deal, cho phép thanh toán lại
    MATCHED --> CLOSED : Thanh toán PAID → tạo Task PREPARATION, gắn Task vào Chat for Task cũ
    CLOSED --> [*]
```

> `NEGOTIATING` là trạng thái suy ra (Request `OPEN` + ít nhất một phản hồi `ACCEPTED`), không lưu thành giá trị riêng.

#### Mô tả chi tiết luồng xử lý bằng chữ (Business Step Description):
* **Bước 1 - Tạo Request**: Học viên tạo `MentoringRequest` (status `OPEN`).
  * UC100 (GENERAL): matching nội bộ tạo N bản ghi `mentoring_request_distributions` (mỗi Mentor phù hợp một bản ghi `PENDING`).
  * UC101 (DIRECT): đúng 1 bản ghi `PENDING` cho Mentor đích (`target_mentor_id`). Hai loại hội tụ về cùng pipeline phía sau.
* **Bước 2 - Mentor phản hồi (UC103)**: ACCEPT chỉ có nghĩa "đồng ý trao đổi". Hệ thống khóa Request + bản ghi phản hồi, chuyển `PENDING → ACCEPTED`, tạo hoặc lấy lại **Chat for Task** (Conversation `MENTORING`, duy nhất cho `(request_id, student_id, mentor_id)`, `mentoring_task_id = null`) và gửi tin nhắn hệ thống *"[Tên Mentor] đã đồng ý trao đổi về Request của bạn."*. Gọi ACCEPT lặp lại trả về đúng Chat cũ. DECLINE chuyển `PENDING → REJECTED` (hiển thị DECLINED).
* **Bước 3 - Thương lượng trong Chat for Task (UC104)**: Mentor gửi Deal Ticket:
  * *Chấp nhận Deal theo Request* (`REQUEST_ACCEPTANCE`): điều khoản lấy từ Request — giá = `budget_max` (nếu trống dùng `budget_min`), deadline = `expected_deadline`, cùng hình thức/loại nhiệm vụ.
  * *Deal lại / Tạo Deal Ticket* (`RENEGOTIATION`): Mentor nhập phạm vi, giá, deadline, hình thức, loại nhiệm vụ, kết quả kỳ vọng, ghi chú.
  * Mỗi lần gửi tạo phiên bản mới (`mentoring_deal_snapshots (deal_id, version)`), Mentor được tính là đã xác nhận; Học viên cần xác nhận lại.
* **Bước 4 - Học viên phản hồi Deal**: *Xác nhận & thanh toán* (2 bước: xác nhận → mở thanh toán), *Yêu cầu điều chỉnh* (`SUPERSEDED`), *Từ chối* (`REJECTED`). Mọi hành động chỉ áp dụng cho phiên bản mới nhất (backend kiểm tra `version`).
* **Bước 5 - Chốt Mentor**: khi hai bên cùng xác nhận một phiên bản, trong cùng transaction: Deal → `DEAL_CONFIRMED` + khóa; Request → `MATCHED`, `selected_mentor_id`, `confirmed_deal_id`; các Deal của Mentor khác → `CANCELLED`; các phản hồi còn `PENDING` → `EXPIRED`; các Chat for Task khác nhận tin *"Request đã chọn Mentor khác."* và chuyển chỉ đọc (lịch sử giữ nguyên).
* **Bước 6 - Thanh toán (UC105)**: chỉ từ Deal đã chốt của Request; số tiền lấy server-side từ `agreed_price`. Thất bại/hết hạn/hủy không tạo Task, không mở lại Request, không bỏ Mentor đã chọn.
* **Bước 7 - Kích hoạt Task**: thanh toán `PAID` (webhook `code = 00` hoặc polling) → tạo đúng 1 `MentoringTask` (`PREPARATION`) liên kết Request, Deal, Conversation, Student, Mentor; `payment.task_id` = Task; `conversation.mentoring_task_id` = Task; Request → `CLOSED`; tin nhắn *"Thanh toán thành công, Task đã được kích hoạt."*. Chat for Task cũ tiếp tục dùng cho Task.

### 3.2 Mentorship - Chuỗi Request → Deal → Payment → Task
Module Mentorship kết nối Học viên với Mentor. Phần này mô tả phần liên kết xuyên suốt UC100–UC105 sao cho có thể truy vết hai chiều:
`Task → Payment → Deal (phiên bản đã chốt) → Conversation → Request → Student + Mentor` và
`Request → Mentor đã ACCEPT → Conversation → các phiên bản Deal → Mentor được chọn → Deal đã chốt → Payment → Task`.

#### 3.2.1 Mentor phản hồi Request & mở Chat for Task (UC103)

**Function trigger**:
*   **Navigation path**: Mentoring → Yêu cầu gửi đến → `/app/mentoring/incoming-requests/:requestId` → "Chấp nhận" / "Từ chối".
*   **Timing Frequency**: On demand.

**Function description**:
*   **Actors/Roles**: Mentor (ALUMNI có hồ sơ Mentor ACTIVE và gói còn hạn).
*   **Purpose**: Mentor đồng ý trao đổi về Request; hệ thống mở Chat for Task gắn đúng Request + Student + Mentor.
*   **Interface**: Nút Chấp nhận / Từ chối (modal nhập lời nhắn). Sau khi chấp nhận, Mentor được chuyển thẳng tới `/app/mentoring/chats/:conversationId`; trang chi tiết có nút "Mở Chat for Task". Nếu Request đã chọn Mentor khác: banner chỉ đọc.

**Data processing**:
*   `POST /api/v1/mentoring/requests/{id}/accept`: kiểm tra tài khoản/hồ sơ/gói Mentor → `SELECT … FOR UPDATE` Request → `SELECT … FOR UPDATE` bản ghi phân phối → nếu đã `ACCEPTED` trả về Chat cũ (idempotent) → kiểm tra Request `OPEN` và chưa có `selected_mentor` → `PENDING → ACCEPTED`, `responded_at` → `MentoringConversationService.getOrCreateConversation` → tin nhắn hệ thống (đẩy WebSocket sau commit).
*   `POST /api/v1/mentoring/requests/{id}/decline`: cùng các kiểm tra, `PENDING → REJECTED`.

**Function details**:
*   **Data**: `request_id`, `mentor_profile_id`, `status`, `responded_at`, `response_note`, `conversationId` (trả về).
*   **Validation**: `responseNote` ≤ 500 ký tự.
*   **Business rules**: BR-FLOW-01, 02, 03, 04, 05.
*   **Error Handling**: 403 Mentor không ACTIVE / gói hết hạn / Request không gửi tới Mentor; 400 Request đã đóng hoặc đã chọn Mentor khác; 409 phản hồi khác trạng thái đã xử lý.
*   **Normal case**: ACCEPT → 200 kèm `conversationId`; gọi lại → 200 cùng `conversationId`.
*   **Abnormal case**: Mentor chưa phản hồi cố ACCEPT sau khi Request đã chọn Mentor → 400 (phản hồi đã `EXPIRED`).

#### 3.2.2 Chat for Task & Deal Ticket (UC104)

**Function trigger**:
*   **Navigation path**: Học viên: My Requests → chi tiết Request → thẻ Mentor `ACCEPTED` → "Mở Chat for Task" → `/app/mentoring/chats/:conversationId`. Mentor: chi tiết Incoming Request → "Mở Chat for Task". Trang Tin nhắn chung tự chuyển hội thoại `MENTORING` sang màn hình này.
*   **Timing Frequency**: On demand; tải lại ngữ cảnh khi có tin nhắn realtime của cuộc hội thoại.

**Function description**:
*   **Actors/Roles**: Học viên chủ Request, Mentor của cuộc hội thoại.
*   **Purpose**: Trao đổi và chốt Deal gắn trực tiếp Request + Conversation.
*   **Interface**:
    *   Header: đối phương, nhãn "Mentor được chọn", "Lịch sử phiên bản", "Xem Task" (khi đã có Task).
    *   Thanh ngữ cảnh Request (mở rộng được): trạng thái Request, ngân sách, thời hạn, loại nhiệm vụ, hình thức, phản hồi của Mentor, liên kết tới trang Request.
    *   Banner: chỉ đọc (`readOnlyReason`), Deal đã khóa chờ thanh toán (kèm trạng thái lần thanh toán gần nhất, nút "Thanh toán"/"Thanh toán lại"), Task đã kích hoạt.
    *   Dòng thời gian: tin nhắn + thẻ Deal Ticket theo từng phiên bản (dựng từ `mentoring_deal_snapshots`, không phân tích nội dung tin nhắn). Thẻ hiển thị: mã, phiên bản, phạm vi, giá, deadline, hình thức làm việc / tham gia, loại nhiệm vụ, nguồn đề xuất, kết quả kỳ vọng, trạng thái.
    *   Mentor: menu "Giao dịch" → "Chấp nhận Deal theo Request" (vô hiệu kèm lý do nếu Request thiếu ngân sách/deadline) và "Deal lại / Tạo Deal Ticket".
    *   Học viên trên phiên bản mới nhất: "Từ chối", "Yêu cầu điều chỉnh", "Xác nhận & thanh toán".
    *   Loading: skeleton; lỗi 403: thông báo không phải thành viên.

**Data processing**:
*   `GET /api/v1/mentoring/conversations/{id}`: xác thực thành viên theo người đăng nhập → trả ngữ cảnh + quyền thao tác tính ở backend.
*   `POST /api/v1/mentoring/deals` (`conversationId`, `proposalSource`, điều khoản khi deal lại): chỉ Mentor của cuộc hội thoại → khóa Request → kiểm tra chỉ đọc, Request `OPEN` chưa chốt, phản hồi `ACCEPTED` → lấy Deal của cuộc hội thoại (hoặc tạo mới) → nếu đã khóa: 409 → `version + 1`, cập nhật điều khoản, `mentor_confirmed = true`, `student_confirmed = false`, `MENTOR_CONFIRMED` → lưu snapshot → tin nhắn hệ thống.
*   `POST /api/v1/mentoring/deals/{id}/confirm` (`{version}`): khóa Request → đọc Deal → kiểm tra thành viên, phiên bản mới nhất, chưa khóa, cuộc hội thoại không chỉ đọc, Request `OPEN` chưa chốt, trạng thái còn hiệu lực → ghi nhận xác nhận → nếu đủ hai bên: chốt Mentor (Bước 5).
*   `POST …/reject?reason&version`, `POST …/request-adjustment?note&version`: chỉ Học viên, chỉ phiên bản đang `MENTOR_CONFIRMED`.

**Function details**:
*   **Data**: `mentoring_deals` (luồng Deal của cuộc hội thoại), `mentoring_deal_snapshots` (phiên bản), `conversations.mentoring_*`.
*   **Validation**: `taskScope` 10–5000 ký tự; `agreedPrice` ≥ 0; `deadline` trong tương lai; `expectedResult` 10–3000; `changeNote` ≤ 255; `version` bắt buộc khi xác nhận.
*   **Business rules**: BR-FLOW-06 → BR-FLOW-14.
*   **Error Handling**: xem 5.3.
*   **Normal case**: Mentor gửi v1 → Học viên xác nhận v1 → Deal khóa, Request `MATCHED`, Chat của Mentor khác chỉ đọc.
*   **Abnormal case**: xác nhận v1 khi đã có v2 → 409; Mentor A đọc/thao tác Chat hoặc Deal của Mentor B → 403; gửi tin trong Chat chỉ đọc → 409.

#### 3.2.3 Thanh toán & kích hoạt Task (UC105)

**Function trigger**:
*   **Navigation path**: Chat for Task → "Xác nhận & thanh toán" (tự mở modal thanh toán sau khi Deal khóa) hoặc banner "Thanh toán / Thanh toán lại".
*   **Timing Frequency**: On demand; polling trạng thái mỗi 3 giây trong modal; webhook PayOS bất đồng bộ.

**Function description**:
*   **Actors/Roles**: Học viên của Deal (thanh toán); Mentor (xem trạng thái); PayOS (webhook).
*   **Purpose**: Thanh toán theo Deal đã chốt và kích hoạt Task.
*   **Interface**: Modal VietQR/checkout, đếm ngược hết hạn; sau khi thành công: Chat hiển thị banner Task + nút "Xem Task" (modal Task kèm truy vết Request → Deal → Task → Chat).

**Data processing**:
*   `POST /api/v1/mentoring/task-payments/checkout` (`{dealId}`): kiểm tra Học viên của Deal, Deal gắn Request + Conversation, `DEAL_CONFIRMED` + khóa + hai bên đã xác nhận, là `confirmed_deal` của Request và Mentor khớp `selected_mentor`, chưa thanh toán / chưa có Task → tái sử dụng giao dịch `PENDING` còn hạn hoặc tạo giao dịch mới với `amount = agreed_price`.
*   Webhook / polling: khóa giao dịch (`FOR UPDATE`) → chỉ xử lý `PENDING` → lệch tiền hoặc `code != 00` → `FAILED` (được lưu) → thành công: khóa Request → `PAID` → Deal `is_paid` → tạo/lấy Task theo `deal_id` (unique) → `payment.task_id` → `conversation.mentoring_task_id` → Request `CLOSED` → tin nhắn hệ thống.
*   Hủy giao dịch: khóa giao dịch để không ghi đè kết quả `PAID`.

**Function details**:
*   **Business rules**: BR-FLOW-15 → BR-FLOW-20.
*   **Normal case**: webhook `00` → 1 Task `PREPARATION`; webhook lặp → không tạo thêm Task, không gửi thêm tin nhắn.
*   **Abnormal case**: `FAILED`/`EXPIRED`/`CANCELLED` → không Task, Request vẫn `MATCHED`, Học viên thanh toán lại tạo payment attempt mới cùng `deal_id`.

---

### 5. Requirement Appendix (Phụ lục Yêu cầu)

#### 5.1 Business Rules (Quy tắc Nghiệp vụ)

| ID | Định nghĩa Quy tắc (Rule Definition) |
| :--- | :--- |
| BR-FLOW-01 | Request chung (UC100) có N bản ghi phản hồi (Request–Mentor) duy nhất theo `(request_id, mentor_profile_id)`; Request trực tiếp (UC101) có đúng 1 bản ghi cho Mentor đích. Sau khi tạo, hai loại đi cùng một pipeline. |
| BR-FLOW-02 | Trạng thái phản hồi: `PENDING`(WAITING) → `ACCEPTED` hoặc `REJECTED`(DECLINED); `EXPIRED` khi Request đã chọn Mentor khác. Không dùng chung trạng thái với xác nhận Deal. |
| BR-FLOW-03 | ACCEPT không xác nhận Deal, không chọn Mentor, không tạo Task, không bỏ qua thanh toán. |
| BR-FLOW-04 | Mỗi bộ `(request_id, student_id, mentor_id)` có duy nhất một Chat for Task (unique index `uq_conversations_mentoring_context`); ACCEPT idempotent nhờ khóa bi quan Request + phản hồi. |
| BR-FLOW-05 | Chỉ được ACCEPT/DECLINE khi Request `OPEN`, chưa có `selected_mentor`, Mentor ACTIVE và gói còn hạn, Mentor nằm trong danh sách nhận Request. |
| BR-FLOW-06 | Chỉ Học viên chủ Request và đúng Mentor của cuộc hội thoại được đọc/gửi tin/xem Deal của Chat for Task; quyền kiểm tra theo người dùng đăng nhập, không theo ID client gửi. |
| BR-FLOW-07 | Deal Ticket bắt buộc gắn `request_id` + `conversation_id` (`ck_mentoring_deals_request_context`); mỗi Chat for Task có một luồng Deal (`uq_mentoring_deals_conversation`), các phiên bản lưu ở `mentoring_deal_snapshots (deal_id, version)`. |
| BR-FLOW-08 | Chỉ Mentor phát hành phiên bản Deal Ticket; Mentor được tính là đã xác nhận phiên bản vừa gửi. |
| BR-FLOW-09 | "Chấp nhận Deal theo Request" lấy giá = `budget_max` (nếu trống: `budget_min`), deadline = `expected_deadline` (phải ở tương lai), hình thức/loại nhiệm vụ của Request; hình thức tham gia `BOTH` được quy về `INDIVIDUAL`. |
| BR-FLOW-10 | Chỉ phiên bản mới nhất được xác nhận / từ chối / yêu cầu điều chỉnh / thanh toán; backend so sánh `version` client gửi với phiên bản hiện tại. |
| BR-FLOW-11 | Yêu cầu điều chỉnh → `SUPERSEDED`; Từ chối → `REJECTED`; cả hai không tạo Task/Payment và không xóa Request; Mentor có thể gửi phiên bản tiếp theo. |
| BR-FLOW-12 | Khi hai bên cùng xác nhận một phiên bản: Deal `DEAL_CONFIRMED` + khóa; không bên nào được sửa; Request `MATCHED` với `selected_mentor_id` + `confirmed_deal_id`. |
| BR-FLOW-13 | Mỗi Request chỉ chốt một Mentor: khóa bi quan Request + unique index `uq_mentoring_deals_request_confirmed` (tối đa 1 Deal `DEAL_CONFIRMED` / Request) + `uq_mentoring_requests_confirmed_deal`. |
| BR-FLOW-14 | Sau khi chốt: Deal của Mentor khác → `CANCELLED`, phản hồi `PENDING` → `EXPIRED`, Chat for Task khác chỉ đọc (không gửi tin, không tạo/xác nhận Deal, không thanh toán), lịch sử được giữ, không cho xóa Chat for Task. |
| BR-FLOW-15 | Thanh toán chỉ từ Deal đã khóa là `confirmed_deal` của Request, Mentor khớp `selected_mentor`; số tiền lấy server-side từ `agreed_price`. |
| BR-FLOW-16 | Mỗi lần thanh toán là một payment attempt truy ngược `deal_id`; giao dịch `PENDING` còn hạn được tái sử dụng. |
| BR-FLOW-17 | `FAILED`/`EXPIRED`/`CANCELLED` không tạo Task, không mở lại Request, không đổi Mentor; Học viên được thanh toán lại. |
| BR-FLOW-18 | Callback/polling `PAID` idempotent: khóa giao dịch, chỉ xử lý `PENDING`, mỗi Deal tối đa 1 Task (`mentoring_tasks.deal_id` unique). |
| BR-FLOW-19 | Task truy ngược Request (`request_id`), Deal (`deal_id`), Conversation (`conversation_id`), Student, Mentor; Payment truy ngược Task (`task_id`). |
| BR-FLOW-20 | Không tạo cuộc hội thoại mới sau thanh toán: `conversations.mentoring_task_id` được gán Task và Chat cũ tiếp tục dùng cho Task. |
| BR-FLOW-21 | Tin nhắn hệ thống chỉ để thông báo; trạng thái nghiệp vụ nằm trong các bảng `mentoring_*` và được đẩy realtime sau khi transaction commit. |

#### 5.2 Common Requirements (Yêu cầu Chung)
*   Mọi API trả về `ApiResponse<T>`; tiền tố `/api/v1`.
*   Thứ tự khóa thống nhất: Request (`FOR UPDATE`) → Deal; thanh toán: Payment (`FOR UPDATE`) → Request.
*   Thông điệp lỗi hiển thị nguyên văn từ backend (Axios interceptor).
*   Ngày giờ hiển thị theo múi giờ người dùng; tiền tệ VND.

#### 5.3 Application Messages List (Danh sách Thông điệp Ứng dụng)

| # | Mã thông điệp (Message code) | Loại thông điệp (Message Type) | Ngữ cảnh (Context) | Nội dung hiển thị (Content) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | MSG-FLOW-01 | System message | Mentor ACCEPT | [Tên Mentor] đã đồng ý trao đổi về Request của bạn. |
| 2 | MSG-FLOW-02 | Toast / 400 | ACCEPT khi Request không mở | Yêu cầu cố vấn này đã đóng, đã chọn Mentor khác hoặc không còn tiếp nhận phản hồi mới |
| 3 | MSG-FLOW-03 | Toast / 403 | Không phải thành viên Chat | Bạn không phải thành viên của Chat for Task này. |
| 4 | MSG-FLOW-04 | Toast / 400 | Conversation không phải MENTORING | Cuộc trò chuyện này không phải Chat for Task của một Mentoring Request. |
| 5 | MSG-FLOW-05 | Toast / 403 | Học viên tạo Deal Ticket | Chỉ Mentor của Chat for Task mới được gửi Deal Ticket. Học viên có thể Xác nhận, Yêu cầu điều chỉnh hoặc Từ chối. |
| 6 | MSG-FLOW-06 | Toast / 403 | Mentor chưa ACCEPT | Bạn cần chấp nhận (ACCEPT) Request trước khi gửi Deal Ticket. |
| 7 | MSG-FLOW-07 | Toast / 400 | Accept theo Request thiếu giá | Request chưa có mức ngân sách đề xuất. Vui lòng dùng "Deal lại / Tạo Deal Ticket" để nhập giá. |
| 8 | MSG-FLOW-08 | Toast / 400 | Accept theo Request thiếu deadline | Request không có thời hạn mong muốn hợp lệ trong tương lai. Vui lòng dùng "Deal lại / Tạo Deal Ticket" để đề xuất deadline. |
| 9 | MSG-FLOW-09 | System message | Mentor gửi Deal Ticket | [Tên Mentor] đã gửi Deal Ticket phiên bản N (Chấp nhận Deal theo Request \| Deal lại). Học viên vui lòng xem và phản hồi. |
| 10 | MSG-FLOW-10 | Toast / 409 | Xác nhận phiên bản cũ | Deal Ticket phiên bản X đã bị thay thế bởi phiên bản Y. Vui lòng tải lại để xem điều khoản mới nhất. |
| 11 | MSG-FLOW-11 | Toast / 409 | Deal đã khóa | Thỏa thuận này đã được cả hai bên xác nhận và khóa trước đó. / Deal Ticket đã được hai bên xác nhận và khóa, không thể tạo phiên bản mới. |
| 12 | MSG-FLOW-12 | Toast / 409 | Request đã chốt | Request đã chốt Deal với một Mentor, không thể tạo hoặc xác nhận Deal mới. |
| 13 | MSG-FLOW-13 | Toast / 409 | Chat chỉ đọc | Chat for Task đang ở chế độ chỉ đọc: Request đã chọn Mentor khác. |
| 14 | MSG-FLOW-14 | System message | Chốt Deal | Hai bên đã xác nhận Deal Ticket phiên bản N. Deal đã được khóa, Học viên vui lòng thanh toán để kích hoạt Task. |
| 15 | MSG-FLOW-15 | System message | Chat của Mentor không được chọn | Request đã chọn Mentor khác. |
| 16 | MSG-FLOW-16 | System message | Yêu cầu điều chỉnh | [Tên Học viên] đã yêu cầu điều chỉnh Deal Ticket phiên bản N: "…". Mentor vui lòng gửi phiên bản Deal Ticket mới. |
| 17 | MSG-FLOW-17 | System message | Từ chối | [Tên Học viên] đã từ chối Deal Ticket phiên bản N[ vì lý do: …]. |
| 18 | MSG-FLOW-18 | Toast / 409 | Thanh toán Deal không phải Deal đã chốt | Deal này không phải là Deal đã chốt của Request, không thể thanh toán. |
| 19 | MSG-FLOW-19 | Toast / 409 | Thanh toán Deal chưa chốt | Thỏa thuận Deal chưa được cả hai bên xác nhận hoàn tất (DEAL_CONFIRMED). Không thể thanh toán. |
| 20 | MSG-FLOW-20 | System message | Thanh toán thành công | Thanh toán thành công, Task đã được kích hoạt. (Task #id · giá · giai đoạn PREPARATION) |
| 21 | MSG-FLOW-21 | Toast / 400 | Xóa Chat for Task | Không thể xóa Chat for Task vì đây là lịch sử thỏa thuận của Mentoring Request. |

#### 5.4 Other Requirements (Yêu cầu Khác)
*   **Dữ liệu legacy**: Deal tạo trước V21 (gắn DM chung) được đánh dấu `CANCELLED` nếu chưa thanh toán và tách khỏi DM chung; Deal đã thanh toán giữ nguyên. Các phản hồi `ACCEPTED` trước V21 được backfill Chat for Task.
*   **UC106+**: Task workspace, giai đoạn `IN_PROGRESS`/`SUBMITTED`/`COMPLETED`, gia hạn deadline (Extension Ticket) tiếp tục dùng Chat for Task đã gắn `mentoring_task_id`.

---

## PHẦN 2: THIẾT KẾ CHI TIẾT (REPORT 4)

### 3. Detail Design (Thiết kế chi tiết)

#### 3.1 Quan hệ dữ liệu (Database Relationship)

```mermaid
erDiagram
    users ||--o{ mentoring_requests : "student_id"
    mentoring_requests ||--o{ mentoring_request_distributions : "request_id (unique request+mentor)"
    mentor_profiles ||--o{ mentoring_request_distributions : "mentor_profile_id"
    mentoring_requests ||--o{ conversations : "mentoring_request_id (MENTORING)"
    conversations ||--o| mentoring_deals : "conversation_id (1 luồng Deal / Chat)"
    mentoring_requests ||--o{ mentoring_deals : "request_id"
    mentoring_deals ||--o{ mentoring_deal_snapshots : "deal_id + version"
    mentoring_requests |o--o| mentoring_deals : "confirmed_deal_id"
    users |o--o{ mentoring_requests : "selected_mentor_id"
    mentoring_deals ||--o{ mentoring_task_payments : "deal_id (payment attempts)"
    mentoring_deals ||--o| mentoring_tasks : "deal_id (unique)"
    mentoring_requests ||--o{ mentoring_tasks : "request_id"
    conversations |o--o| mentoring_tasks : "mentoring_task_id / conversation_id"
    mentoring_tasks |o--o{ mentoring_task_payments : "task_id"
```

#### 3.2 Class Diagram (Sơ đồ Lớp)

```mermaid
classDiagram
    class MentoringRequestController {
        +acceptIncomingRequest(id, dto) ResponseEntity
        +declineIncomingRequest(id, dto) ResponseEntity
    }
    class MentoringConversationController {
        +getConversationContext(conversationId) ResponseEntity
        +getConversationsByRequest(requestId) ResponseEntity
    }
    class MentoringDealController {
        +proposeDeal(ProposeDealRequest) ResponseEntity
        +updateDealTerms(id, UpdateDealRequest) ResponseEntity
        +confirmDeal(id, ConfirmDealRequest) ResponseEntity
        +rejectDeal(id, reason, version) ResponseEntity
        +requestAdjustment(id, note, version) ResponseEntity
    }
    class MentoringTaskPaymentController {
        +createTaskPayment(CreateTaskPaymentRequest) ResponseEntity
        +checkTaskPaymentStatus(orderCode) ResponseEntity
        +handleWebhook(Webhook) ResponseEntity
    }
    class MentoringRequestServiceImpl {
        +acceptIncomingRequest(email, requestId, dto)
        +declineIncomingRequest(email, requestId, dto)
    }
    class MentoringConversationServiceImpl {
        +getOrCreateConversation(request, mentor) Conversation
        +requireParticipantConversation(userId, conversationId) Conversation
        +resolveReadOnlyReason(conversation) String
        +assertWritable(conversation)
        +postSystemMessage(conversation, sender, content)
    }
    class MentoringChatContextServiceImpl {
        +getConversationContext(userId, conversationId) MentoringConversationResponse
        +getConversationsByRequest(userId, requestId) List
    }
    class MentoringDealServiceImpl {
        +proposeDeal(userId, ProposeDealRequest)
        +confirmDeal(userId, dealId, version)
        +rejectDeal(userId, dealId, reason, version)
        +requestAdjustment(userId, dealId, note, version)
        -issueNewVersion(...)
        -finalizeConfirmedDeal(...)
    }
    class MentoringTaskPaymentServiceImpl {
        +createTaskPayment(userId, request)
        +checkTaskPaymentStatus(userId, orderCode)
        +handlePayOSWebhook(webhook)
        -activateTaskUponPaymentSuccess(payment)
    }
    class ChatServiceImpl {
        +sendMessage(email, SendMessageRequest)
        +deleteConversation(email, id)
    }
    class MentoringRequest { status; selectedMentor; confirmedDeal }
    class MentoringRequestDistribution { status; respondedAt }
    class Conversation { type=MENTORING; mentoringRequest; mentoringStudent; mentoringMentor; mentoringTask }
    class MentoringDeal { request; conversation; version; status; isLocked; isPaid }
    class MentoringDealSnapshot { deal; version; proposalSource }
    class MentoringTaskPayment { deal; task; amount; paymentStatus }
    class MentoringTask { deal; request; conversation; status }

    MentoringRequestController ..> MentoringRequestServiceImpl
    MentoringConversationController ..> MentoringChatContextServiceImpl
    MentoringDealController ..> MentoringDealServiceImpl
    MentoringTaskPaymentController ..> MentoringTaskPaymentServiceImpl
    MentoringRequestServiceImpl --> MentoringConversationServiceImpl
    MentoringDealServiceImpl --> MentoringConversationServiceImpl
    MentoringTaskPaymentServiceImpl --> MentoringConversationServiceImpl
    MentoringChatContextServiceImpl --> MentoringDealServiceImpl
    MentoringChatContextServiceImpl --> MentoringConversationServiceImpl
    ChatServiceImpl --> MentoringConversationServiceImpl
    MentoringRequest "1" --> "*" MentoringRequestDistribution
    MentoringRequest "1" --> "*" Conversation
    Conversation "1" --> "0..1" MentoringDeal
    MentoringDeal "1" --> "*" MentoringDealSnapshot
    MentoringDeal "1" --> "*" MentoringTaskPayment
    MentoringDeal "1" --> "0..1" MentoringTask
```

###### Mô tả chi tiết cấu trúc các lớp (Class Design Description):
* **Lớp Controller**: `MentoringRequestController` (ACCEPT/DECLINE), `MentoringConversationController` (ngữ cảnh Chat for Task, mới), `MentoringDealController` (phát hành phiên bản, xác nhận có `version`, từ chối/điều chỉnh), `MentoringTaskPaymentController` (checkout, polling, webhook).
* **Lớp DTO**: `ProposeDealRequest` (`conversationId`, `proposalSource`, điều khoản tùy chọn — không nhận `mentorId/studentId/requestId` từ client), `ConfirmDealRequest` (`version` bắt buộc), `MentoringConversationResponse` (ngữ cảnh + quyền), `MentoringDealResponse` (thêm `requestTitle`, `requestStatus`, `canPay`, `canReject`, `canRequestAdjustment`, `readOnlyReason`), `MentorIncomingRequestDetailResponse` / `MentorResponseItemResponse` (thêm `conversationId`, cờ Mentor được chọn), `MentoringTaskResponse` (thêm `requestId`, `requestTitle`, `conversationId`).
* **Lớp Service**: `MentoringConversationService` (hạ tầng Chat for Task: get-or-create idempotent, xác thực thành viên, chỉ đọc, tin nhắn hệ thống đẩy WebSocket sau commit), `MentoringChatContextService` (truy vấn ngữ cảnh), `MentoringDealService` (phiên bản & chốt Mentor), `MentoringTaskPaymentService` (thanh toán & kích hoạt Task idempotent), `ChatServiceImpl` (chặn gửi tin trong Chat chỉ đọc, chặn xóa Chat for Task).
* **Lớp Mapper**: `MentoringDealMapper` (map `request.id/title/status`), `MentoringTaskMapper` (map `request`, `conversation`), `MessageMapper` (thêm `mentoringRequestId`, `mentoringTaskId` vào `ConversationResponse`).
* **Lớp Repository & Entity**: `MentoringRequestRepository.findByIdForUpdate`, `MentoringRequestDistributionRepository.findForUpdate` / `findByRequestIdAndMentorUserId` / `findByRequestIdAndStatus`, `MentoringDealRepository.findByConversationId` / `findRequestIdByDealId` / `findByIdForUpdate`, `ConversationRepository.findByMentoringRequestIdAndMentoringMentorId` / `findByMentoringRequestIdOrderByCreatedAtAsc`; entity `Conversation` (thêm `mentoringRequest/Student/Mentor/Task`), `MentoringRequest` (thêm `selectedMentor`, `confirmedDeal`), `MentoringDeal` (`request` thành quan hệ), `MentoringTask` (thêm `request`).

#### 3.3 Sequence Diagram (Sơ đồ Tuần tự)

```mermaid
sequenceDiagram
    autonumber
    actor Mentor
    actor Student as Học viên
    participant ReqSvc as MentoringRequestServiceImpl
    participant ConvSvc as MentoringConversationServiceImpl
    participant DealSvc as MentoringDealServiceImpl
    participant PaySvc as MentoringTaskPaymentServiceImpl
    participant PayOS
    participant DB as PostgreSQL

    Mentor->>ReqSvc: POST /mentoring/requests/{id}/accept
    ReqSvc->>DB: SELECT request FOR UPDATE; SELECT distribution FOR UPDATE
    alt Phản hồi đã ACCEPTED (retry)
        ReqSvc->>ConvSvc: getOrCreateConversation (trả Chat cũ)
        ReqSvc-->>Mentor: 200 + conversationId (không tạo mới)
    else Request không OPEN / đã chọn Mentor
        ReqSvc-->>Mentor: 400
    else Hợp lệ
        ReqSvc->>DB: distribution PENDING → ACCEPTED
        ReqSvc->>ConvSvc: getOrCreateConversation + postSystemMessage
        ReqSvc-->>Mentor: 200 + conversationId
    end

    Mentor->>DealSvc: POST /mentoring/deals {conversationId, proposalSource}
    DealSvc->>ConvSvc: requireParticipantConversation (403 nếu không phải Mentor của Chat)
    DealSvc->>DB: SELECT request FOR UPDATE
    alt Chat chỉ đọc / Request đã chốt / Deal đã khóa
        DealSvc-->>Mentor: 409
    else Hợp lệ
        DealSvc->>DB: deal.version+1, MENTOR_CONFIRMED; INSERT snapshot
        DealSvc->>ConvSvc: postSystemMessage
        DealSvc-->>Mentor: 201
    end

    Student->>DealSvc: POST /mentoring/deals/{id}/confirm {version}
    DealSvc->>DB: SELECT request FOR UPDATE; SELECT deal
    alt version cũ
        DealSvc-->>Student: 409 phiên bản đã bị thay thế
    else Request đã chọn Mentor khác (thao tác đồng thời thua)
        DealSvc-->>Student: 409
    else Hợp lệ
        DealSvc->>DB: deal DEAL_CONFIRMED + lock; request MATCHED, selected_mentor, confirmed_deal
        DealSvc->>DB: Deal khác → CANCELLED; phản hồi PENDING → EXPIRED
        DealSvc->>ConvSvc: "Request đã chọn Mentor khác." vào Chat khác
        DealSvc-->>Student: 200 DEAL_CONFIRMED
    end

    Student->>PaySvc: POST /mentoring/task-payments/checkout {dealId}
    PaySvc->>DB: kiểm tra confirmed_deal, selected_mentor, chưa thanh toán
    PaySvc->>PayOS: createPaymentLink(amount = agreed_price)
    PaySvc-->>Student: 201 VietQR / checkoutUrl

    PayOS->>PaySvc: Webhook (orderCode, amount, code)
    PaySvc->>DB: SELECT payment FOR UPDATE
    alt Không PENDING (đã xử lý)
        PaySvc-->>PayOS: 200 (bỏ qua, idempotent)
    else Lệch tiền hoặc code != 00
        PaySvc->>DB: payment FAILED (Request vẫn MATCHED)
    else Thành công
        PaySvc->>DB: SELECT request FOR UPDATE; payment PAID; deal is_paid
        PaySvc->>DB: INSERT task (request, deal, conversation) nếu chưa có
        PaySvc->>DB: conversation.mentoring_task_id; request CLOSED
        PaySvc->>ConvSvc: "Thanh toán thành công, Task đã được kích hoạt."
    end
```

###### Mô tả chi tiết luồng xử lý bằng chữ (Sequence Flow Description):
1.  **Luồng 1 - Thành công (Normal Case)**: Mentor ACCEPT → Chat for Task → Mentor gửi Deal Ticket → Học viên xác nhận đúng phiên bản → Deal khóa, chọn Mentor → thanh toán theo `agreed_price` → webhook `00` → Task `PREPARATION` gắn vào Chat cũ.
2.  **Luồng 2 - Ngoại lệ Validation đầu vào**: DTO vi phạm ràng buộc (thiếu `conversationId`/`version`, giá âm, deadline quá khứ...) → 400 với danh sách lỗi.
3.  **Luồng 3 - Ngoại lệ nghiệp vụ**: phiên bản cũ, Request đã chốt, Chat chỉ đọc, Deal đã khóa → 409; không phải thành viên / sai vai trò → 403; Request đóng khi ACCEPT → 400; thanh toán thất bại → `FAILED`, Request giữ `MATCHED` để thanh toán lại.
4.  **Luồng 4 - Đồng thời**: hai lần ACCEPT đồng thời → tuần tự qua khóa, chỉ 1 Chat; hai lần xác nhận Deal của hai Mentor đồng thời → lần sau thấy Request đã chốt → 409; webhook + polling đồng thời → khóa giao dịch, chỉ 1 Task.

#### 3.4 Kiểm thử tích hợp (Integration Test)
`MentoringEndToEndFlowIntegrationTest` (PostgreSQL `alumnect_test`, PayOS giả lập) bao phủ các kịch bản A–J: luồng chung thành công, hai Mentor cạnh tranh, Request trực tiếp, ACCEPT idempotent (tuần tự & đồng thời), từ chối phiên bản cũ, xác nhận đồng thời một người thắng, webhook lặp, thanh toán thất bại giữ lựa chọn, chặn truy cập chéo Mentor (service & HTTP 403), bỏ qua số tiền client gửi.
