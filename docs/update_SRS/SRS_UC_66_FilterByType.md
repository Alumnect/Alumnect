# ĐẶC TẢ YÊU CẦU & THIẾT KẾ CHI TIẾT: UC66 - Filter By Type

## PHẦN 1: ĐẶC TẢ NGHIỆP VỤ (REPORT 3)

### 2.2.3 Business Workflow (Luồng nghiệp vụ)
<!--
Mô tả bằng sơ đồ Mermaid (State/Activity Diagram) kết hợp với danh sách các bước xử lý nghiệp vụ thực tế của hệ thống từ đầu tới cuối.
-->
```mermaid
stateDiagram-v2
    [*] --> Receive_Request : GET /api/v1/admin/posts
    Receive_Request --> Validate_Params : Kiểm tra query, author, status, type, page, size
    Validate_Params --> Service_Call : adminPostService.getPosts(...)
    Service_Call --> Return_Response : ApiResponse<PageResponse<AdminPostResponse>>
    Return_Response --> [*]
```

#### Mô tả chi tiết luồng xử lý bằng chữ (Business Step Description):
* **Bước 1 – Nhận yêu cầu**: Frontend gọi endpoint `GET /api/v1/admin/posts` với các tham số tùy chọn.
* **Bước 2 – Kiểm tra tham số**: Spring tự động kiểm tra `@RequestParam(required = false)`; nếu giá trị không hợp lệ trả về `400 Bad Request`.
* **Bước 3 – Gọi Service**: Controller truyền các tham số (`query`, `author`, `status`, `type`, `page`, `size`) cho `adminPostService.getPosts`.
* **Bước 4 – Trả về kết quả**: Service trả về `PageResponse<AdminPostResponse>` được bọc trong `ApiResponse.success` và gửi lại cho client.

### 3.2 Admin Post Management (Module quản trị bài viết)

#### 3.2.1 Filter By Type (UC66)

**Function trigger**:
* **Navigation path**: `Admin > Bài viết > Xem danh sách`
* **Timing Frequency**: On demand (khi người dùng truy cập trang hoặc thay đổi bộ lọc).

**Function description**:
* **Actors/Roles**: ADMIN
* **Purpose**: Lọc danh sách bài viết theo loại (`NORMAL`, `EVENT`, `RECRUITMENT`, `ACHIEVEMENT`) cùng các bộ lọc khác.
* **Interface**:
  * **Request method**: `GET`
  * **Query parameters**:
    - `query` (string, optional) – Từ khóa nội dung
    - `author` (string, optional) – Tên hoặc email tác giả
    - `status` (string, optional) – `VISIBLE`, `HIDDEN` hoặc `ALL`
    - `type` (string, optional) – `NORMAL`, `EVENT`, `RECRUITMENT`, `ACHIEVEMENT` hoặc `ALL`
    - `page` (int, required) – Số trang (0‑based)
    - `size` (int, required) – Số phần tử mỗi trang
  * **Response**: `ApiResponse<PageResponse<AdminPostResponse>>`
    - `content` – Danh sách DTO bài viết
    - `totalElements`, `totalPages`, `pageSize`, `pageNumber`, `last`

**Data processing**:
* Controller chuyển tham số sang Service.
* Service tạo `Specification<Post>` thông qua `PostSpecification.filterPosts` để xây dựng predicate động dựa trên các tham số.
* Repository thực hiện truy vấn phân trang (`findAll(spec, pageable)`).
* Mapper chuyển `Post` entity sang `AdminPostResponse` DTO.

**Screen layout**:
* Không áp dụng (Backend API).

**Function details**:
* **Data**: Các trường của `AdminPostResponse` (id, authorName, authorEmail, type, content, imageUrl, visibility, likeCount, commentCount, repostCount, hidden, createdAt).
* **Validation**: Các tham số không bắt buộc; `page` và `size` có giá trị mặc định `0` và `10` nếu không truyền.
* **Business rules**:
  - Nếu `type` không thuộc các giá trị cho phép trả về `400 Bad Request`.
  - Nếu `status` không hợp lệ trả về `400 Bad Request`.
* **Error Handling**:
  - `400` – Tham số không hợp lệ.
  - `500` – Lỗi server nội bộ.
* **Normal case**: Truy vấn thành công, trả về danh sách bài viết (có hoặc không có dữ liệu).
* **Abnormal case**: Tham số không hợp lệ hoặc lỗi DB, trả về thông báo lỗi chi tiết.

---

## PHẦN 2: THIẾT KẾ CHI TIẾT (REPORT 4)

### 3. Detail Design (Thiết kế chi tiết)

#### 3.1 AdminPostController
```java
@GetMapping
public ResponseEntity<ApiResponse<PageResponse<AdminPostResponse>>> getPosts(
        @RequestParam(required = false) String query,
        @RequestParam(required = false) String author,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String type,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    PageResponse<AdminPostResponse> posts = adminPostService.getPosts(query, author, status, type, page, size);
    return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bài viết thành công", posts));
}
```

#### 3.2 AdminPostService
```java
PageResponse<AdminPostResponse> getPosts(String query, String author, String status, String type, int page, int size);
```

#### 3.3 PostSpecification
```java
public static Specification<Post> filterPosts(String query, String author, String status, String type) {
    return (root, queryObj, cb) -> {
        List<Predicate> predicates = new ArrayList<>();
        if (StringUtils.hasText(query)) {
            predicates.add(cb.like(cb.lower(root.get("content")), "%" + query.toLowerCase() + "%"));
        }
        if (StringUtils.hasText(author)) {
            Join<Post, User> userJoin = root.join("author", JoinType.LEFT);
            predicates.add(cb.or(
                cb.like(cb.lower(userJoin.get("fullName")), "%" + author.toLowerCase() + "%"),
                cb.like(cb.lower(userJoin.get("email")), "%" + author.toLowerCase() + "%")
            ));
        }
        if (StringUtils.hasText(status)) {
            predicates.add(cb.equal(root.get("visibility"), status.toUpperCase()));
        }
        if (StringUtils.hasText(type)) {
            predicates.add(cb.equal(root.get("type"), type.toUpperCase()));
        }
        return cb.and(predicates.toArray(new Predicate[0]));
    };
}
```

#### 3.4 Class Diagram (Mermaid)
```mermaid
classDiagram
    class AdminPostController {
        +ResponseEntity<ApiResponse<PageResponse<AdminPostResponse>>> getPosts(String query, String author, String status, String type, int page, int size)
    }
    class AdminPostService {
        +PageResponse<AdminPostResponse> getPosts(String query, String author, String status, String type, int page, int size)
    }
    class AdminPostServiceImpl {
        -PostRepository postRepository
        -AdminPostMapper adminPostMapper
        +PageResponse<AdminPostResponse> getPosts(String query, String author, String status, String type, int page, int size)
    }
    class PostSpecification {
        +static Specification<Post> filterPosts(String query, String author, String status, String type)
    }
    class PostRepository {
        +Page<Post> findAll(Specification<Post> spec, Pageable pageable)
    }
    class AdminPostMapper {
        +AdminPostResponse toDto(Post post)
    }
    AdminPostController --> AdminPostService : uses
    AdminPostServiceImpl ..|> AdminPostService : implements
    AdminPostServiceImpl --> PostRepository : uses
    AdminPostServiceImpl --> AdminPostMapper : uses
    AdminPostServiceImpl --> PostSpecification : uses
```

---

#### 5.3 Application Messages List (Danh sách Thông điệp Ứng dụng)

| # | Mã thông điệp (Message code) | Loại thông điệp (Message Type) | Ngữ cảnh (Context) | Nội dung hiển thị (Content) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | MSG-UC66-01 | Toast message | Lấy danh sách bài viết theo bộ lọc thành công | Lấy danh sách bài viết thành công. |
| 2 | MSG-UC66-02 | EmptyState | Không tìm thấy bài viết nào khớp bộ lọc | Không tìm thấy bài viết nào phù hợp với bộ lọc hiện tại. |
| 3 | MSG-UC66-03 | Toast Error | Không có quyền Quản trị viên | Bạn không có quyền truy cập chức năng quản trị bài viết. |

---

## PHẦN 2: THIẾT KẾ CHI TIẾT (REPORT 4)

### 3. Detail Design (Thiết kế chi tiết)

#### 3.1.1 Class Diagram (Sơ đồ Lớp)
*(Đã định nghĩa tại mục 3.4)*

#### 3.1.2 Sequence Diagram (Sơ đồ Tuần tự)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Quản trị viên (Admin)
    participant UI as AdminPostsPage (FE)
    participant Controller as AdminPostController
    participant Service as AdminPostServiceImpl
    participant Spec as PostSpecification
    participant Repo as PostRepository
    participant DB as PostgreSQL

    Admin->>UI: Chọn loại bài viết (NORMAL/EVENT/RECRUITMENT/ACHIEVEMENT) & bấm Lọc
    UI->>Controller: GET /api/v1/admin/posts?type={type}&page=0&size=10 (Bearer JWT)
    
    alt Không có quyền ADMIN
        Controller-->>UI: HTTP 403 Forbidden
        UI-->>Admin: Hiển thị lỗi từ chối truy cập
    else Có quyền ADMIN hợp lệ
        Controller->>Service: getPosts(query, author, status, type, page, size)
        Service->>Spec: filterPosts(query, author, status, type)
        Spec-->>Service: Specification<Post>
        Service->>Repo: findAll(spec, pageable)
        Repo->>DB: SELECT p.* FROM posts p WHERE p.type = ? ORDER BY p.created_at DESC LIMIT 10 OFFSET 0
        DB-->>Repo: Page<Post>
        Repo-->>Service: Page<Post>
        Service-->>Controller: PageResponse<AdminPostResponse>
        Controller-->>UI: HTTP 200 OK (ApiResponse: "Lấy danh sách bài viết thành công", PageResponse)
        UI-->>Admin: Hiển thị danh sách bài viết theo đúng thể loại đã lọc
    end
```

###### Mô tả chi tiết luồng xử lý bằng chữ (Sequence Flow Description):
1. **Luồng thành công**: Quản trị viên chọn loại bài viết trên thanh lọc giao diện Admin. Frontend gọi API `GET /api/v1/admin/posts?type=...`. Backend kiểm tra quyền Admin, xây dựng vị từ JPA `Specification<Post>` tương ứng, thực thi truy vấn phân trang trên PostgreSQL và trả về `PageResponse<AdminPostResponse>` với mã `200 OK`.
2. **Luồng từ chối quyền**: Người dùng không có vai trò `ADMIN` gọi API. Spring Security chặn và phản hồi `403 Forbidden`.

