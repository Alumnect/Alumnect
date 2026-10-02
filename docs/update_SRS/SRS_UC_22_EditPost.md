# ĐẶC TẢ YÊU CẦU & THIẾT KẾ CHI TIẾT: UC22 - Chỉnh sửa bài viết (Edit a post)

## PHẦN 1: ĐẶC TẢ NGHIỆP VỤ (REPORT 3)

### 2.2.3 Business Workflow (Luồng nghiệp vụ)

```mermaid
stateDiagram-v2
    [*] --> MoModalChinhSua : Tac gia bam "Sua" tren bai viet cua minh
    MoModalChinhSua --> FormFormDienSan : Pre-fill noi dung, loai, anh, visibility
    FormFormDienSan --> SoanNoiDung : Chinh sua noi dung / loai / anh / visibility
    SoanNoiDung --> GuiCapNhat : Bam "Luu thay doi" (noi dung hop le)

    GuiCapNhat --> TuChoi401 : Guest / het phien
    GuiCapNhat --> TuChoi403_Role : Vai tro khong phai STUDENT/ALUMNI
    GuiCapNhat --> TuChoi403_Owner : Khong phai tac gia bai viet (Owner Check)
    GuiCapNhat --> KhongKhaDung404 : Bai an / khong ton tai
    GuiCapNhat --> Loi400 : Noi dung rong/>5000 (validate server)
    GuiCapNhat --> ThanhCong200 : Cap nhat Post trong DB (@PreUpdate updated_at)

    ThanhCong200 --> DongModal_CapNhatUI : Invalidate cache feed/post detail + dong modal
    TuChoi401 --> SoanNoiDung : Hien thong diep loi
    TuChoi403_Role --> SoanNoiDung : Hien thong diep loi
    TuChoi403_Owner --> SoanNoiDung : Hien thong diep loi
    KhongKhaDung404 --> SoanNoiDung : Hien thong diep loi
    Loi400 --> SoanNoiDung : Hien thong diep loi
    DongModal_CapNhatUI --> [*]
```

#### Mô tả chi tiết luồng xử lý bằng chữ (Business Step Description):
- **Bước 1 - Khởi đầu**: Tác giả bài viết (thành viên `STUDENT`/`ALUMNI`) thấy nút "Sửa" (`Pencil` icon) trên thẻ bài viết của chính mình ở Bảng tin (`/app`) hoặc Trang chi tiết (`/app/posts/{id}`). Người dùng khác hoặc Guest không thấy nút này.
- **Bước 2 - Pre-fill form**: Bấm nút "Sửa" mở `CreatePostModal` ở chế độ chỉnh sửa: tiêu đề đổi thành "Chỉnh sửa bài viết", form tự động nạp trước nội dung cũ (`text`), loại bài (`type`), ảnh đính kèm (`image`), phạm vi hiển thị (`visibility`).
- **Bước 3 - Kiểm tra phía client**: Nút "Lưu thay đổi" bị vô hiệu hóa khi nội dung rỗng (sau trim) hoặc đang lưu; giới hạn tối đa 5000 ký tự đồng bộ với ràng buộc backend.
- **Bước 4 - Gửi yêu cầu**: Frontend gọi `PUT /api/v1/posts/{id}` với payload `EditPostRequest` (`{ content, type, visibility, imageUrl }`); token Bearer được interceptor `http` tự đính kèm.
- **Bước 5 - Xác thực & phân quyền tại Backend**:
  - Endpoint yêu cầu JWT → Guest bị chặn **401**.
  - Service `resolveMemberOrThrow`: chỉ `STUDENT`/`ALUMNI` mới được sửa bài (vai trò khác/Admin → **403**).
  - Service `loadViewablePost`: bài đã ẩn hoặc không tồn tại → **404**.
  - Service **Ownership Check**: `post.getUser().getId() != author.getId()` → **403** ("Bạn chỉ được chỉnh sửa bài viết của chính mình").
- **Bước 6 - Cập nhật & lưu DB**: Cập nhật các trường `content`, `type`, `visibility`, `image_url`. JPA Entity `@PreUpdate` tự động cập nhật `updated_at`. Trả về `PostResponse` (200 OK).
- **Bước 7 - Hiển thị & đồng bộ UI**: Frontend tự động invalidate cache TanStack Query `['feed']` và `['post', id]`, làm mới dữ liệu bài viết trên UI tức thì và đóng modal.

---

### 3.2 Module 3 - Social: Feed, Posts, Events, Packages & Messaging

#### 3.2.2 Chỉnh sửa bài viết (Edit a post)

**Function trigger**:
- **Navigation path**: Nút "Sửa" (`Pencil` icon) ở header thẻ bài viết trên FeedPage (`/app`) hoặc PostDetailPage (`/app/posts/{id}`).
- **Timing Frequency**: On-demand — khi tác giả muốn chỉnh sửa bài viết đã đăng của mình.

**Function description**:
- **Actors/Roles**: Student, Alumni (chính tác giả bài viết). Các người dùng khác hoặc Admin không có quyền sửa (người khác → 403; Admin → 403; Guest → 401).
- **Purpose**: Cho phép tác giả cập nhật nội dung văn bản, loại bài viết, phạm vi hiển thị hoặc ảnh đính kèm sau khi đăng bài.
- **Interface**:
  - `CreatePostModal` (chế độ Edit): Tiêu đề "Chỉnh sửa bài viết", ô nhập text pre-fill, bộ chọn loại bài pre-fill, công khai/thành viên pre-fill, ảnh preview (có nút xóa ảnh), nút "Hủy" và "Lưu thay đổi".
  - Nút "Sửa" trên thẻ bài viết: chỉ xuất hiện khi `currentUserName === post.author`.

**Data processing**:
1. Frontend gọi `PUT /api/v1/posts/{id}` với body `{ content, type, visibility, imageUrl }`.
2. Spring Security kiểm tra token JWT (Guest → 401).
3. Backend kiểm tra vai trò `STUDENT`/`ALUMNI` (else 403).
4. Backend nạp bài viết (bài ẩn/không tồn tại → 404).
5. Backend kiểm tra quyền sở hữu tác giả: `post.user.id == current_user.id` (else 403).
6. Backend lưu thay đổi vào DB (`posts` table), `@PreUpdate` cập nhật `updated_at`. Map → `PostResponse` (200 OK).
7. Frontend invalidate queries `['feed']` và `['post', id]`, đóng modal.

**Validation Rules**:
- `content`: Bắt buộc, không để trống sau trim, tối đa 5000 ký tự — vi phạm trả về **400**.
- `type`: Enum `NORMAL` | `ACHIEVEMENT` | `RECRUITMENT` | `EVENT` (Frontend gửi chữ thường).
- `visibility`: Enum `PUBLIC` | `MEMBERS`.
- `imageUrl`: Tùy chọn, tối đa 500 ký tự.

---

### 5. Requirement Appendix (Phụ lục Yêu cầu)

#### 5.1 Business Rules (Quy tắc Nghiệp vụ)

| ID | Định nghĩa Quy tắc (Rule Definition) |
| :--- | :--- |
| BR-EDIT-01 | Chỉ tác giả sở hữu bài viết (`STUDENT`/`ALUMNI`) mới được phép chỉnh sửa bài viết của mình. Người dùng khác hoặc Admin cố chỉnh sửa sẽ bị từ chối với lỗi **403 Forbidden**. |
| BR-EDIT-02 | Bài viết đã bị Admin ẩn (`is_hidden = true`) không thể chỉnh sửa — trả về "không còn khả dụng" (**404 Not Found**). |
| BR-EDIT-03 | Khi bài viết được chỉnh sửa thành công, trường `updated_at` trong CSDL được tự động cập nhật qua JPA `@PreUpdate`. |
| BR-EDIT-04 | Guest chưa đăng nhập không có quyền chỉnh sửa bài viết (nút Sửa không hiển thị; Backend trả về **401 Unauthorized**). |

---

#### 5.3 Application Messages List (Danh sách Thông điệp Ứng dụng)

| # | Mã thông điệp (Message code) | Loại thông điệp (Message Type) | Ngữ cảnh (Context) | Nội dung hiển thị (Content) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | MSG-EDIT-01 | Toast message | Chỉnh sửa bài viết thành công | Chỉnh sửa bài viết thành công. |
| 2 | MSG-EDIT-02 | In red, under field | Nội dung bài viết để trống sau trim | Nội dung bài viết không được để trống. |
| 3 | MSG-EDIT-03 | In red, under field | Độ dài vượt quá 5000 ký tự | Nội dung bài viết tối đa 5000 ký tự. |
| 4 | MSG-EDIT-04 | Alert Banner / Toast | Bài viết không tồn tại hoặc đã bị ẩn | Bài viết không còn khả dụng hoặc đã bị gỡ. |
| 5 | MSG-EDIT-05 | Toast Error | Không phải tác giả sở hữu bài viết | Bạn chỉ được chỉnh sửa bài viết của chính mình. |
| 6 | MSG-EDIT-06 | In line | Guest chưa đăng nhập gọi API | Người dùng chưa đăng nhập hoặc phiên làm việc đã hết hạn. |

---

## PHẦN 2: THIẾT KẾ CHI TIẾT (REPORT 4)

### 3. Detail Design (Thiết kế chi tiết)

#### 3.1 UC22 Chỉnh sửa bài viết (Edit a post)

##### 3.1.1 Class Diagram (Sơ đồ Lớp)

```mermaid
classDiagram
    %% Controller Layer
    class PostController {
        +editPost(id: Long, request: EditPostRequest, authentication: Authentication) ResponseEntity~ApiResponse~PostResponse~~
    }

    %% DTO Layer
    class EditPostRequest {
        -String content
        -PostType type
        -PostVisibility visibility
        -String imageUrl
    }

    class PostResponse {
        -Long id
        -String author
        -String content
        -String type
        -String visibility
        -String imageUrl
        -Instant updatedAt
    }

    %% Service Layer
    class PostService {
        <<interface>>
        +editPost(authorEmail: String, id: Long, request: EditPostRequest) PostResponse
    }

    class PostServiceImpl {
        -PostRepository postRepository
        -UserRepository userRepository
        -PostMapper postMapper
        +editPost(authorEmail: String, id: Long, request: EditPostRequest) PostResponse
    }

    %% Repository & Entity
    class PostRepository {
        <<interface>>
        +findById(id: Long) Optional~Post~
        +save(post: Post) Post
    }

    class UserRepository {
        <<interface>>
        +findByEmail(email: String) Optional~User~
    }

    class Post {
        -Long id
        -User user
        -String content
        -PostType type
        -PostVisibility visibility
        -String imageUrl
        -Instant updatedAt
    }

    %% Frontend Components & Hooks
    class CreatePostModal {
        +editPost: Post
        +isOpen: boolean
        +onClose() void
    }

    class useEditPost {
        +mutate(payload) void
        +isLoading: boolean
    }

    PostController ..> EditPostRequest : validates & uses
    PostController ..> PostService : calls
    PostServiceImpl ..|> PostService : implements
    PostServiceImpl --> PostRepository : uses
    PostServiceImpl --> UserRepository : uses
    PostServiceImpl --> Post : manipulates
    PostServiceImpl ..> PostResponse : returns
    CreatePostModal ..> useEditPost : triggers
    useEditPost ..> PostController : HTTP PUT
```

###### Mô tả chi tiết cấu trúc các lớp (Class Design Description):
* **Lớp Controller (`PostController.java`)**: Cung cấp API `PUT /api/v1/posts/{id}` tiếp nhận yêu cầu cập nhật, kiểm tra tính hợp lệ của DTO qua `@Valid` và trích xuất email tác giả từ SecurityContext.
* **Lớp DTO (`EditPostRequest.java`, `PostResponse.java`)**: Định nghĩa cấu trúc dữ liệu gửi lên và kết quả bài viết hoàn chỉnh trả về sau khi cập nhật.
* **Lớp Service (`PostService.java`, `PostServiceImpl.java`)**: Kiểm tra quyền thành viên (`resolveMemberOrThrow`), nạp bài viết (`loadViewablePost`), xác minh quyền sở hữu (`post.getUser().getId().equals(author.getId())`), cập nhật các trường thông tin và lưu vào DB.
* **Lớp Repository & Entity (`PostRepository.java`, `Post.java`)**: Tương tác cơ sở dữ liệu PostgreSQL, thực hiện lưu trữ và JPA `@PreUpdate` tự động làm mới thời gian `updated_at`.
* **Lớp Frontend (`CreatePostModal.tsx`, `useEditPost.ts`)**: Component modal chỉnh sửa bài viết kết hợp với hook React Query Mutation để gọi API và invalidate cache.

##### 3.1.2 Sequence Diagram (Sơ đồ Tuần tự)

```mermaid
sequenceDiagram
    autonumber
    actor User as Tác giả (Student/Alumni)
    participant UI as CreatePostModal (FE)
    participant Controller as PostController (@Valid)
    participant Service as PostServiceImpl
    participant UserRepo as UserRepository
    participant PostRepo as PostRepository
    participant DB as PostgreSQL

    User->>UI: Chỉnh sửa nội dung & bấm "Lưu thay đổi"
    UI->>Controller: PUT /api/v1/posts/{id} (Bearer JWT, EditPostRequest JSON)
    
    alt Trường hợp 1: Dữ liệu không hợp lệ (content trống hoặc > 5000 ký tự)
        Note over Controller: JSR-380 validation thất bại
        Controller-->>UI: HTTP 400 Bad Request (ApiResponse báo lỗi trường chi tiết)
        UI-->>User: Hiển thị lỗi đỏ dưới khung nhập liệu
        
    else Trường hợp 2: Dữ liệu hợp lệ
        Controller->>Service: editPost(authorEmail, id, request)
        Service->>UserRepo: findByEmail(authorEmail)
        UserRepo->>DB: SELECT * FROM users WHERE email = ?
        DB-->>UserRepo: User entity
        UserRepo-->>Service: User author
        
        Service->>PostRepo: findById(id)
        PostRepo->>DB: SELECT * FROM posts WHERE id = ?
        DB-->>PostRepo: Post entity
        PostRepo-->>Service: Post post
        
        alt Trường hợp 2.1: Bài viết không tồn tại hoặc đã bị ẩn
            Service-->>Controller: throw ResourceNotFoundException("Bài viết không còn khả dụng")
            Controller-->>UI: HTTP 404 Not Found (ApiResponse thông báo lỗi)
            UI-->>User: Hiển thị Toast lỗi & đóng modal
            
        else Trường hợp 2.2: Không phải tác giả sở hữu bài viết
            Service-->>Controller: throw ForbiddenException("Bạn chỉ được chỉnh sửa bài viết của chính mình")
            Controller-->>UI: HTTP 403 Forbidden (ApiResponse từ chối thao tác)
            UI-->>User: Hiển thị Toast cảnh báo quyền sở hữu
            
        else Trường hợp 2.3: Hợp lệ (Cập nhật thành công)
            Note over Service: Cập nhật content, type, visibility, imageUrl
            Service->>PostRepo: save(post)
            PostRepo->>DB: UPDATE posts SET content = ?, updated_at = NOW() WHERE id = ?
            DB-->>PostRepo: Post updated
            PostRepo-->>Service: Post entity
            Service-->>Controller: PostResponse DTO
            Controller-->>UI: HTTP 200 OK (ApiResponse: "Chỉnh sửa bài viết thành công", PostResponse)
            Note over UI: Invalidate cache TanStack Query ['feed'] & ['post', id]
            UI-->>User: Đóng Modal & Cập nhật bài viết tức thì trên giao diện
        end
    end
```

###### Mô tả chi tiết luồng xử lý bằng chữ (Sequence Flow Description):
1. **Luồng 1 - Thành công (Normal Case)**: Tác giả gửi yêu cầu chỉnh sửa hợp lệ. Backend kiểm tra quyền sở hữu bài viết, cập nhật các trường thông tin trong bảng `posts`, kích hoạt JPA `@PreUpdate` cập nhật thời gian sửa đổi và trả về `200 OK` cùng `PostResponse`. Frontend cập nhật UI lạc quan và invalidate cache để đồng bộ toàn bộ bảng tin.
2. **Luồng 2 - Ngoại lệ Validation (Validation Error Case)**: Nội dung rỗng hoặc vượt quá 5000 ký tự. Bộ lọc JSR-380 phát hiện lỗi, ném ngoại lệ và trả về `HTTP 400 Bad Request`.
3. **Luồng 3 - Ngoại lệ Quyền sở hữu (Ownership Violation Case)**: Người dùng cố tình sửa bài của người khác. Backend phát hiện ID tác giả không khớp, ném `ForbiddenException` và trả về `HTTP 403 Forbidden`.
4. **Luồng 4 - Ngoại lệ Không tồn tại (Not Found Case)**: Bài viết đã bị xóa hoặc Admin ẩn vi phạm. Backend ném `ResourceNotFoundException` và trả về `HTTP 404 Not Found`.


### 1. Data Schema & Constraints
- Bảng `posts` (Flyway migration V4) chứa các cột:
  - `id`: BIGINT (Primary Key)
  - `user_id`: BIGINT (FK users.id)
  - `type`: VARCHAR(20) (NORMAL/ACHIEVEMENT/RECRUITMENT/EVENT)
  - `content`: TEXT (NOT NULL)
  - `image_url`: VARCHAR(500)
  - `visibility`: VARCHAR(20) (PUBLIC/MEMBERS)
  - `updated_at`: TIMESTAMPTZ (Auto updated via `@PreUpdate`)

### 2. API Endpoint Specification
- **Endpoint**: `PUT /api/v1/posts/{id}`
- **Auth**: Bearer JWT Required
- **Request DTO**: `EditPostRequest` (`content`, `type`, `imageUrl`, `visibility`)
- **Response**: `ApiResponse<PostResponse>` (HTTP 200 OK)

### 3. Frontend Architecture
- API Client: `feedApi.editPost(postId, input)` (`PUT /api/v1/posts/{postId}${id}`)
- Custom Hook: `useEditPost()` (TanStack Query `useMutation`)
- Modal Component: `CreatePostModal` (hỗ trợ prop `editPost?: Post`)
- UI Placement: Nút "Sửa" trên `PostCard` (FeedPage) và `PostDetailCard` (PostDetailPage) kiểm tra điều kiện tác giả `currentUserName === post.author`.
