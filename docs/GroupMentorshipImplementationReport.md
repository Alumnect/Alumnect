# Group Mentorship Implementation Report

## Phạm vi hoàn thành

Group Mentorship được tích hợp trực tiếp vào Create Mentoring Request cho cả GENERAL và DIRECT. Thiết kế dùng bảng nghiệp vụ riêng cho nhóm mentoring, nhưng tái sử dụng hoàn toàn hạ tầng conversation/message hiện có.

## Quyết định kiến trúc

* Không dùng `community_groups`: vòng đời, trạng thái và quyền của community group khác mentoring group.
* Không tạo bảng chat/message mới: selected mentoring conversation được mở rộng participant sau payment.
* `BOTH` không đồng nghĩa `GROUP`; chỉ giá trị GROUP tạo membership.
* Request giữ `group_id`; Task suy ra group qua Request để tránh dữ liệu trùng.
* Membership được soft-state để audit; conversation participant bị xóa khi remove để thu hồi quyền tức thời.

## Database

Migration `V31__add_group_mentorship.sql` thêm:

* `mentoring_groups`
* `mentoring_group_members`
* `mentoring_group_member_events`
* `mentoring_requests.group_id`
* `mentoring_requests.client_request_key`
* Notification type `MENTORING_GROUP`

## API

* `GET /api/v1/mentoring/groups/mine`
* `GET /api/v1/mentoring/groups/invitations/mine`
* `GET /api/v1/mentoring/groups/{id}`
* `POST /api/v1/mentoring/groups/{id}/members`
* `POST /api/v1/mentoring/groups/{id}/accept`
* `POST /api/v1/mentoring/groups/{id}/decline`
* `DELETE /api/v1/mentoring/groups/{id}/members/{userId}`

`POST /api/v1/mentoring/requests` nhận thêm `memberIds` và `clientRequestKey`.

## Frontend

* Create form chỉ hiển thị member picker khi chọn GROUP.
* Tìm người dùng thật theo tên/email, debounce 300 ms.
* Hiển thị leader, selected member, pending state và validation.
* Trang `/app/mentoring/groups` hiển thị lời mời và nhóm đang tham gia.
* Request detail có group summary.
* Notification Center nhận và điều hướng `MENTORING_GROUP`.

## Kiểm soát quyền

| Hành động | Leader | Mentor đã chọn | Active member |
|---|---:|---:|---:|
| Xem Task/Work Log/kết quả | Có | Có | Có |
| Nhắn tin trong Task chat | Có | Có | Có |
| Quản lý member | Có | Sau khi có Task | Không |
| Deal/Payment | Có | Có | Không |
| Xác nhận Work Log/Completion | Có | Có | Không |
| Settlement/Dispute | Có | Có | Không |

## Xác minh

* Backend compile: `mvnw.cmd -q -DskipTests compile` — pass.
* Backend unit test: `MentoringGroupServiceImplTest` — pass.
* Frontend production build: `npm run build` — pass.
* Test matrix TC01–TC40 nằm trong `SRS_UC_122_Group_Mentorship.md`.
