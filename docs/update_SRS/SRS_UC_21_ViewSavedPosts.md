# ĐẶC TẢ YÊU CẦU & THIẾT KẾ CHI TIẾT: UC21 - XEM DANH SÁCH BÀI VIẾT ĐÃ LƯU (VIEW SAVED POSTS)

## PHẦN 1: ĐẶC TẢ NGHIỆP VỤ (REPORT 3)

### 2.2.3 Business Workflow (Luồng nghiệp vụ)

```mermaid
stateDiagram-v2
    [*] --> ViewingProfile : Người dùng truy cập Hồ sơ cá nhân (/app/profile)
    ViewingProfile --> SelectSavedTab : Nhấn tab "Bài viết đã lưu" (chỉ hiển thị với chủ tài khoản)
    SelectSavedTab --> LoadingSavedPosts : Gửi yêu cầu GET /api/v1/posts/saved?page=0&size=10
    
    state LoadingSavedPosts {
        [*] --> CheckAuth : Xác thực JWT & Quyền thành viên
        CheckAuth --> QueryDatabase : Người dùng hợp lệ (STUDENT / ALUMNI)
        CheckAuth --> UnauthorizedError : Chưa đăng nhập (401) hoặc Sai quyền (403)
        QueryDatabase --> ReturnSavedPosts : Truy vấn danh sách bài viết còn ACTIVE đã lưu
    }

    LoadingSavedPosts --> DisplaySavedPosts : Nhận danh sách bài viết (200 OK)
    LoadingSavedPosts --> DisplayError : Lỗi xác thực hoặc lỗi hệ thống
    
    DisplaySavedPosts --> FilterByCategory : Chuyển đổi tab lọc (Tất cả, Thành tựu, Tuyển dụng, Sự kiện)
    DisplaySavedPosts --> LoadMorePosts : Cuộn xuống / Nhấn "Tải thêm" (Next Page)
    DisplaySavedPosts --> QuickUnsave : Nhấn nút "Bỏ lưu" (BookmarkX)
    
    QuickUnsave --> DisplaySavedPosts : Cập nhật UI lạc quan & xóa bài khỏi danh sách
    FilterByCategory --> DisplaySavedPosts : Lọc bài viết hiển thị theo danh mục
    LoadMorePosts --> DisplaySavedPosts : Nối thêm bài viết từ trang tiếp theo

    DisplaySavedPosts --> [*] : Rời trang hoặc hoàn thành xem
    DisplayError --> [*] : Kết thúc
```

#### Mô tả chi tiết luồng xử lý bằng chữ (Business Step Description):
* **Bước 1 - Khởi đầu**: Người dùng đã đăng nhập (Student hoặc Alumni) truy cập trang hồ sơ cá nhân (`/app/profile`) hoặc chọn mục "Bài viết đã lưu" từ menu tài khoản (Avatar Dropdown) để kích hoạt tab `saved` (`/app/profile?tab=saved`).
* **Bước 2 - Kiểm tra quyền và truy vấn**: Hệ thống Backend xác thực Token JWT và quyền hạn `STUDENT`/`ALUMNI`. `PostService` truy vấn bảng `post_saves` kết hợp với bảng `posts` để lấy danh sách bài viết còn tồn tại (`status = 'ACTIVE'`) mà người dùng đã lưu, sắp xếp giảm dần theo thời gian lưu mới nhất (`created_at DESC`).
* **Bước 3 - Hiển thị giao diện**: Frontend nhận dữ liệu phân trang `PageResponse<PostResponse>` và hiển thị danh sách bài viết dạng Card chuẩn Instagram/Facebook (gồm thông tin tác giả, loại bài viết, nội dung, ảnh đính kèm, việc làm/sự kiện, số lượt thích, số bình luận).
* **Bước 4 - Tương tác**: Người dùng có thể lọc danh sách theo danh mục (`Tất cả`, `Thành tựu`, `Tuyển dụng`, `Sự kiện`), bấm nút "Bỏ lưu" (`BookmarkX`) để hủy lưu bài viết trực tiếp hoặc bấm "Tải thêm" khi có nhiều trang bài viết.

---

### 3.2 Quản Lý Bài Viết & Tương Tác Cộng Đồng (Community Feed & Social)
Module quản lý toàn bộ bài viết trên bảng tin cộng đồng AlumNect, bao gồm các bài viết thông thường, bài viết thành tựu vinh danh, tin tuyển dụng việc làm, thông báo sự kiện, tính năng tương tác thả tim, bình luận và đánh dấu lưu bài viết cá nhân.

#### 3.2.1 Xem danh sách bài viết đã lưu (View Saved Posts - UC21)

**Function trigger**:
*   **Navigation path**: Mở trang hồ sơ cá nhân `/app/profile` -> Bấm chọn tab "Bài viết đã lưu" (`/app/profile?tab=saved`).
*   **Timing Frequency**: On demand (bất cứ khi nào người dùng muốn xem lại bộ sưu tập bài viết đã bookmark).

**Function description**:
*   **Actors/Roles**: `STUDENT` (Sinh viên), `ALUMNI` (Cựu sinh viên). Khách vãng lai (`GUEST`) hoặc người dùng khác xem hồ sơ người này sẽ **không** nhìn thấy tab "Bài viết đã lưu" nhằm bảo đảm quyền riêng tư tuyệt đối.
*   **Purpose**: Cung cấp không gian lưu trữ cá nhân riêng tư giúp thành viên dễ dàng tìm lại các bài chia sẻ kiến thức hữu ích, tin tuyển dụng tiềm năng hoặc sự kiện họp mặt đã đánh dấu trước đó.
*   **Interface**:
    *   **Header Tool Bar**: Các tab lọc danh mục kèm số đếm bài viết (`Tất cả`, `Thành tựu`, `Tuyển dụng`, `Sự kiện`) và nút chuyển đổi chế độ xem Lưới (Grid) / Dòng thời gian (Feed).
    *   **Saved Grid View (Mặc định)**: Lưới thẻ 3 cột gọn gàng theo phong cách Instagram, hiển thị ảnh bìa, badge thể loại tương phản cao (`bg-white/95 text-sky-700 font-extrabold`), tiêu đề tóm tắt, avatar tác giả và nút xóa/bỏ lưu nhanh.
    *   **Saved Feed View**: Dòng thời gian chi tiết hiển thị thẻ bài viết đầy đủ thông tin: Avatar tác giả, Tên tác giả, Badge phân loại, Thời gian đăng, Nội dung text, Khối việc làm/sự kiện đính kèm, Carousel ảnh, Nút Thả tim, Nút Bình luận và Nút "Đã lưu" / "Bỏ lưu".
    *   **States**:
        *   *Loading*: Khung xương bài viết (`SavedPostsSkeleton`).
        *   *Empty*: Hiển thị minh họa Bookmark với nút bấm chuyển hướng "Khám phá Bảng tin".
        *   *Error*: Thông báo lỗi mạng kèm nút "Thử lại".
        *   *Load More*: Nút bấm "Tải thêm bài viết" kèm hiệu ứng spinner quay khi đang tải trang kế tiếp.

**Data processing**:
1. Client gửi yêu cầu HTTP `GET /api/v1/posts/saved?page={page}&size={size}` kèm Bearer Access Token.
2. `JwtFilter` xác thực tính hợp lệ của token và nạp `Authentication` vào `SecurityContextHolder`.
3. `PostController.getSavedPosts()` chuyển tiếp request tới `PostService.getSavedPosts(email, page, size)`.
4. `PostServiceImpl` gọi `resolveMemberOrThrow(email)` để lấy `User` hiện tại và xác thực vai trò thành viên (`STUDENT`/`ALUMNI`).
5. `PostSaveRepository.findActiveSavedPostsByUserId(userId, pageable)` thực hiện câu lệnh SQL:
   ```sql
   SELECT ps FROM PostSave ps
   JOIN ps.post p
   WHERE ps.user.id = :userId AND p.status = 'ACTIVE'
   ORDER BY ps.createdAt DESC
   ```
6. Dịch vụ trích xuất danh sách `Post`, batch load `UserProfile`, `JobPosting`, `Event`, trạng thái `liked` của người dùng và ánh xạ sang `PageResponse<PostResponse>` với trường `saved = true`.
7. Client nhận dữ liệu, cập nhật cache TanStack Query `['saved-posts']` và kết xuất ra giao diện.

**Screen layout**:
*   *Figure 21.1*: Tab "Bài viết đã lưu" trong trang cá nhân người dùng trên giao diện Desktop.
*   *Figure 21.2*: Danh sách bài viết đã lưu kèm bộ lọc danh mục và nút bỏ lưu nhanh.
*   *Figure 21.3*: Giao diện Empty State khi chưa có bài viết nào được lưu.

**Function details**:
*   **Data**:
    *   `page` (int, default: 0): Chỉ số trang cần lấy.
    *   `size` (int, default: 10): Số bài viết mỗi trang.
    *   `accessToken` (string, Bearer Header): Token xác thực người dùng.
*   **Validation**:
    *   `page` >= 0, `size` > 0 và <= 50.
    *   Token JWT phải hợp lệ, chưa hết hạn và thuộc người dùng đang hoạt động (`status = 'ACTIVE'`).
*   **Business rules**:
    *   **BR-01 (Quyền truy cập)**: Chỉ chủ tài khoản sở hữu danh sách mới được phép xem danh sách bài viết đã lưu của mình. Người khác xem trang cá nhân sẽ không thấy tab này.
    *   **BR-02 (Trạng thái bài viết)**: Chỉ các bài viết có trạng thái `status = 'ACTIVE'` mới được hiển thị. Các bài viết đã bị tác giả hoặc Admin ẩn/xóa sẽ tự động bị loại khỏi danh sách truy vấn.
    *   **BR-03 (Bỏ lưu tức thì)**: Khi người dùng nhấn nút "Bỏ lưu", hệ thống gọi API `DELETE /api/v1/posts/{id}/save` và tự động loại bài viết đó khỏi giao diện danh sách.
*   **Error Handling**:
    *   `401 Unauthorized`: Token không hợp lệ hoặc đã hết hạn -> Chuyển hướng người dùng về trang đăng nhập.
    *   `403 Forbidden`: Tài khoản bị khóa hoặc không có quyền thành viên -> Hiển thị thông báo từ chối truy cập.
    *   `500 Internal Server Error`: Lỗi kết nối cơ sở dữ liệu -> Hiển thị nút "Thử lại".
*   **Normal case**: Người dùng xem danh sách các bài viết đã lưu theo thứ tự thời gian giảm dần, lọc theo loại bài viết thành công, tải thêm các trang kế tiếp mượt mà.
*   **Abnormal case**: Mất kết nối Internet -> Hiển thị giao diện thông báo lỗi kết nối kèm nút Retry.

---

### 5. Requirement Appendix (Phụ lục Yêu cầu)

#### 5.1 Business Rules (Quy tắc Nghiệp vụ)

| ID | Định nghĩa Quy tắc (Rule Definition) |
| :--- | :--- |
| BR-01 | Danh sách bài viết đã lưu là dữ liệu riêng tư 100% của từng tài khoản người dùng, không công khai cho bất kỳ ai khác xem. |
| BR-02 | Chỉ các bài viết có trạng thái `ACTIVE` mới được trả về trong danh sách đã lưu. |
| BR-03 | Phân trang danh sách bài viết đã lưu bắt đầu từ `page = 0`, kích thước mặc định `size = 10`. |
| BR-04 | Khi bài viết gốc bị xóa hoàn toàn khỏi hệ thống, bản ghi trong bảng `post_saves` sẽ tự động bị xóa theo nhờ cơ chế `ON DELETE CASCADE`. |

#### 5.2 Common Requirements (Yêu cầu Chung)
*   Giao diện tuân thủ tiêu chuẩn thiết kế Pastel Premium của AlumNect (màu canvas kem `#faf4ec`, chữ mận chín `#322c3f`, điểm nhấn cam FPT `#F27024`).
*   Dữ liệu được tải theo cơ chế phân trang vô hạn (Infinite Scroll) thông qua TanStack Query.
*   Tất cả các định dạng bài viết đa hình (bài thường, thành tựu, việc làm tuyển dụng, sự kiện) được kết xuất đồng bộ và trực quan.

---

## PHẦN 2: THIẾT KẾ KỸ THUẬT CHI TIẾT (REPORT 4)

### 1.1 Class Diagram (Sơ đồ Lớp Chi tiết)

```mermaid
classDiagram
    class PostController {
        -PostService postService
        +getSavedPosts(Authentication authentication, int page, int size) ResponseEntity~ApiResponse~PageResponse~PostResponse~~~
    }

    class PostService {
        <<interface>>
        +getSavedPosts(String email, int page, int size) PageResponse~PostResponse~
    }

    class PostServiceImpl {
        -PostRepository postRepository
        -PostSaveRepository postSaveRepository
        -UserRepository userRepository
        -MemberRepository memberRepository
        -UserProfileRepository userProfileRepository
        -JobPostingRepository jobPostingRepository
        -EventRepository eventRepository
        -PostLikeRepository postLikeRepository
        -PostMapper postMapper
        +getSavedPosts(String email, int page, int size) PageResponse~PostResponse~
        -resolveMemberOrThrow(String email) User
    }

    class PostSaveRepository {
        <<interface>>
        +findActiveSavedPostsByUserId(Long userId, Pageable pageable) Page~PostSave~
        +findSavedPostIds(Long userId, List~Long~ postIds) List~Long~
    }

    class PostSave {
        -Long id
        -User user
        -Post post
        -Instant createdAt
        +getId() Long
        +getUser() User
        +getPost() Post
        +getCreatedAt() Instant
    }

    class Post {
        -Long id
        -User author
        -String content
        -PostType type
        -PostStatus status
        -Instant createdAt
    }

    class PostResponse {
        -String id
        -String author
        -String authorId
        -String avatar
        -String text
        -String type
        -String time
        -int likes
        -int comments
        -boolean liked
        -boolean saved
        -JobDto job
        -EventDto event
        -List~String~ images
    }

    class PageResponse~T~ {
        -List~T~ content
        -int page
        -int size
        -long totalElements
        -int totalPages
        -boolean hasNext
    }

    PostController --> PostService : delegates to
    PostServiceImpl ..|> PostService : implements
    PostServiceImpl --> PostSaveRepository : queries
    PostSaveRepository ..> PostSave : manages
    PostSave --> Post : references
    PostController ..> PageResponse~PostResponse~ : returns
```

#### Mô tả chi tiết Sơ đồ Lớp (Class Diagram Description):
* **`PostController`**: Lớp Controller REST nhận các yêu cầu HTTP `GET /api/v1/posts/saved`, trích xuất thông tin định danh người dùng từ `Authentication` và ủy quyền xử lý nghiệp vụ cho `PostService`.
* **`PostService` & `PostServiceImpl`**: Tầng xử lý nghiệp vụ chính. Xác thực người dùng, gọi `PostSaveRepository.findActiveSavedPostsByUserId` để lấy danh sách bài viết đã lưu có phân trang, nạp thông tin phụ trợ (hồ sơ, đính kèm, trạng thái tương tác) và đóng gói vào `PageResponse<PostResponse>`.
* **`PostSaveRepository`**: Giao diện Spring Data JPA định nghĩa truy vấn tùy biến `findActiveSavedPostsByUserId` lọc các bài viết `ACTIVE` của người dùng sắp xếp theo ngày lưu giảm dần.
* **`PostSave` & `Post`**: Các thực thể JPA ánh xạ với các bảng tương ứng trong cơ sở dữ liệu PostgreSQL.

---

### 1.2 Sequence Diagram (Sơ đồ Tuần tự Chi tiết)

```mermaid
sequenceDiagram
    autonumber
    actor User as Thành viên (Student / Alumni)
    participant UI as ProfilePage / SavedPostsView (React)
    participant Query as TanStack Query (useSavedPosts)
    participant Api as feedApi.ts
    participant Ctrl as PostController
    participant Svc as PostServiceImpl
    participant Repo as PostSaveRepository
    participant DB as PostgreSQL

    User->>UI: Truy cập tab "Bài viết đã lưu" (/app/profile?tab=saved)
    UI->>Query: Kích hoạt hook useSavedPosts()
    Query->>Api: Gọi feedApi.getSavedPosts({ page: 0, size: 10 })
    Api->>Ctrl: GET /api/v1/posts/saved?page=0&size=10 [Bearer JWT]

    alt Token không hợp lệ hoặc Hết hạn
        Ctrl-->>Api: 401 Unauthorized
        Api-->>Query: Ném lỗi 401
        Query-->>UI: Chuyển hướng người dùng về trang /login
    else Người dùng không có quyền thành viên
        Ctrl->>Svc: getSavedPosts(email, page, size)
        Svc->>Svc: resolveMemberOrThrow(email) -> Thất bại
        Svc-->>Ctrl: Ném ForbiddenException("Chỉ dành cho thành viên")
        Ctrl-->>Api: 403 Forbidden (ApiResponse.error(-1))
        Api-->>Query: Ném lỗi phân quyền
        Query-->>UI: Hiển thị thông báo từ chối truy cập
    else Xác thực thành công (Happy Path)
        Ctrl->>Svc: getSavedPosts(email, page, size)
        Svc->>Svc: resolveMemberOrThrow(email) -> Trả về User hợp lệ
        Svc->>Repo: findActiveSavedPostsByUserId(userId, pageable)
        Repo->>DB: SELECT ps FROM post_saves JOIN posts WHERE user_id = ? AND status = 'ACTIVE' ORDER BY created_at DESC
        DB-->>Repo: Danh sách bản ghi PostSave (Page<PostSave>)
        Repo-->>Svc: Trả về Page<PostSave>
        
        Svc->>Svc: Batch load UserProfile, Job, Event, LikeStatus
        Svc->>Svc: Map sang PageResponse<PostResponse> (với saved = true)
        Svc-->>Ctrl: Trả về PageResponse<PostResponse>
        Ctrl-->>Api: 200 OK (ApiResponse.success(PageResponse<PostResponse>))
        Api-->>Query: Trả về FeedPageResult { items, page, hasMore }
        Query-->>UI: Cung cấp danh sách bài viết đã lưu
        UI-->>User: Kết xuất các thẻ bài viết đã lưu theo phong cách Instagram
    end

    opt Người dùng bấm nút "Bỏ lưu" trên bài viết
        User->>UI: Nhấn nút "Bỏ lưu" (BookmarkX)
        UI->>UI: Cập nhật UI lạc quan (loại bài khỏi danh sách)
        UI->>Api: DELETE /api/v1/posts/{id}/save
        Api->>Ctrl: DELETE /api/v1/posts/{id}/save [Bearer JWT]
        Ctrl->>Svc: unsavePost(email, postId)
        Svc->>DB: DELETE FROM post_saves WHERE user_id = ? AND post_id = ?
        DB-->>Svc: 1 row deleted
        Svc-->>Ctrl: SavePostResponse { postId, saved: false }
        Ctrl-->>Api: 200 OK
        Api-->>UI: Đồng bộ cache 'saved-posts'
    end
```

#### Mô tả chi tiết Sơ đồ Tuần tự (Sequence Diagram Description):
1. **Khởi tạo yêu cầu**: Người dùng chọn tab "Bài viết đã lưu", giao diện `ProfilePage` nạp component `SavedPostsView`, kích hoạt hook `useSavedPosts`.
2. **Xác thực và rẽ nhánh**:
   - Nếu Token JWT bị thiếu, không hợp lệ hoặc hết hạn, hệ thống trả về mã `401 Unauthorized` và điều hướng về trang đăng nhập.
   - Nếu tài khoản không thuộc quyền `STUDENT` hoặc `ALUMNI`, hệ thống trả về mã `403 Forbidden`.
   - Nếu hợp lệ, hệ thống thực hiện truy vấn cơ sở dữ liệu `findActiveSavedPostsByUserId`, nạp đầy đủ thông tin chi tiết và trả về mã `200 OK` kèm `PageResponse<PostResponse>`.
3. **Hiển thị và Bỏ lưu nhanh**: Giao diện hiển thị danh sách bài viết. Khi người dùng bấm nút "Bỏ lưu", giao diện phản hồi lạc quan ngay lập tức, đồng thời gửi request `DELETE /posts/{id}/save` để cập nhật cơ sở dữ liệu.
