package com.alumnect.alumnect_backend.service.post;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.CommentStatus;
import com.alumnect.alumnect_backend.common.enums.PostType;
import com.alumnect.alumnect_backend.common.enums.PostVisibility;
import com.alumnect.alumnect_backend.dao.post.CommentRepository;
import com.alumnect.alumnect_backend.dao.post.PostLikeRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.post.CreateCommentRequest;
import com.alumnect.alumnect_backend.dto.request.post.CreatePostRequest;
import com.alumnect.alumnect_backend.dto.response.post.CommentResponse;
import com.alumnect.alumnect_backend.dto.response.post.LikeResponse;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;
import com.alumnect.alumnect_backend.entity.post.Comment;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.post.PostLike;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.post.CommentMapper;
import com.alumnect.alumnect_backend.mapper.post.PostMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Lớp dịch vụ thực thi logic nghiệp vụ của bảng tin cộng đồng (UC15 - View community Feed).
 * Triển khai interface {@link PostService}.
 */
@Service
public class PostServiceImpl implements PostService {

    private static final Logger log = LoggerFactory.getLogger(PostServiceImpl.class);

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostMapper postMapper;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private CommentMapper commentMapper;

    @Autowired
    private PostLikeRepository postLikeRepository;

    /**
     * {@inheritDoc}
     * <p>
     * Luồng xử lý:
     * <ol>
     *   <li>Nạp tài khoản đang đăng nhập theo email (lấy từ JWT).</li>
     *   <li>RBAC: chỉ STUDENT/ALUMNI được đăng bài, vai trò khác (VD Admin) bị từ chối với lỗi 403.</li>
     *   <li>Chuẩn hóa loại bài viết & phạm vi hiển thị (mặc định NORMAL/PUBLIC), ném 400 nếu giá trị không hợp lệ.</li>
     *   <li>Lưu bài viết mới (các bộ đếm like/comment/repost = 0, isHidden = false).</li>
     *   <li>Map sang {@link PostResponse} kèm hồ sơ tác giả để Frontend chèn ngay vào đầu bảng tin.</li>
     * </ol>
     */
    @Override
    @Transactional
    public PostResponse createPost(String email, CreatePostRequest request) {
        User author = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        // RBAC (UC14): chỉ Sinh viên và Cựu sinh viên mới được đăng bài; Admin/khác bị từ chối 403.
        String roleName = author.getRole() != null ? author.getRole().getName().toUpperCase() : "";
        if (!roleName.equals("STUDENT") && !roleName.equals("ALUMNI")) {
            throw new ForbiddenException("Chỉ sinh viên và cựu sinh viên mới được đăng bài viết");
        }

        // Chuẩn hóa loại bài & phạm vi hiển thị (tái sử dụng cùng cách parse như luồng xem bảng tin).
        PostType type = parsePostType(request.getType());
        PostVisibility visibility = parsePostVisibility(request.getVisibility());

        // Ảnh đính kèm là tùy chọn: chuỗi rỗng coi như không có ảnh.
        String imageUrl = request.getImageUrl() != null && !request.getImageUrl().isBlank()
                ? request.getImageUrl().trim()
                : null;

        Post post = Post.builder()
                .user(author)
                .type(type != null ? type : PostType.NORMAL)
                .content(request.getContent().trim())
                .imageUrl(imageUrl)
                .visibility(visibility != null ? visibility : PostVisibility.PUBLIC)
                .likeCount(0)
                .commentCount(0)
                .repostCount(0)
                .isHidden(false)
                .build();

        Post saved;
        try {
            saved = postRepository.save(post);
        } catch (Exception ex) {
            log.error("Lỗi khi lưu bài viết mới của user {}: ", email, ex);
            throw new RuntimeException("Lỗi hệ thống: Không thể tạo bài viết");
        }
        log.info("Tạo bài viết mới: id={}, tác giả={}, loại={}, visibility={}",
                saved.getId(), email, saved.getType(), saved.getVisibility());

        // Nạp hồ sơ tác giả để trả về response đầy đủ (tên/avatar/headline) cho Frontend.
        // Bài vừa tạo chưa ai thích nên cờ liked = false (UC17).
        UserProfile profile = userProfileRepository.findById(author.getId()).orElse(null);
        return postMapper.toResponse(saved, profile, false);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng xử lý:
     * <ol>
     *   <li>Kiểm tra tham số phân trang ({@code page} ≥ 0, {@code size} ≥ 1), ném lỗi 400 nếu vi phạm.</li>
     *   <li>Chuyển chuỗi {@code type} (nếu có) sang enum {@link PostType}, ném lỗi 400 nếu giá trị không hợp lệ.</li>
     *   <li>Truy vấn trang bài viết qua {@link PostRepository#findFeed}, đã JOIN FETCH sẵn tác giả (User) để tránh N+1 query.</li>
     *   <li>Truy vấn gộp (batch) hồ sơ {@link UserProfile} của toàn bộ tác giả xuất hiện trong trang — tránh N+1 query lần 2.</li>
     *   <li>Map từng bài viết sang {@link PostResponse} rồi đóng gói vào {@link PageResponse}.</li>
     * </ol>
     */
    @Override
    public PageResponse<PostResponse> getFeed(int page, int size, String type, boolean isAuthenticated, String viewerEmail) {
        // Validate tham số phân trang trước khi tạo PageRequest — nếu không, PageRequest.of()
        // sẽ ném IllegalArgumentException và bị trả về nhầm HTTP 500 thay vì 400.
        if (page < 0) {
            throw new BadRequestException("Tham số page phải là số nguyên không âm");
        }
        if (size <= 0) {
            throw new BadRequestException("Tham số size phải là số nguyên dương");
        }

        PostType postType = parsePostType(type);
        boolean guestMode = !isAuthenticated;

        Page<Post> postsPage = postRepository.findFeed(guestMode, postType, PageRequest.of(page, size));
        log.info("Lấy bảng tin: page={}, size={}, type={}, guestMode={}, tổng kết quả={}",
                page, size, type, guestMode, postsPage.getTotalElements());

        // Gộp truy vấn hồ sơ tác giả theo lô (batch) thay vì truy vấn riêng lẻ cho từng bài viết.
        List<Long> authorIds = postsPage.getContent().stream()
                .map(p -> p.getUser().getId())
                .distinct()
                .collect(Collectors.toList());
        Map<Long, UserProfile> profileByUserId = userProfileRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));

        // Tính cờ liked theo người xem hiện tại: batch-fetch các bài đã thích (tránh N+1 query).
        List<Long> postIds = postsPage.getContent().stream().map(Post::getId).collect(Collectors.toList());
        Set<Long> likedPostIds = computeLikedPostIds(viewerEmail, postIds);

        List<PostResponse> content = postsPage.getContent().stream()
                .map(post -> postMapper.toResponse(post, profileByUserId.get(post.getUser().getId()),
                        likedPostIds.contains(post.getId())))
                .collect(Collectors.toList());

        return PageResponse.<PostResponse>builder()
                .content(content)
                .pageNumber(postsPage.getNumber())
                .pageSize(postsPage.getSize())
                .totalElements(postsPage.getTotalElements())
                .totalPages(postsPage.getTotalPages())
                .last(postsPage.isLast())
                .build();
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng xử lý: nạp bài viết có kiểm tra quyền xem (xem {@link #loadViewablePost}),
     * nạp hồ sơ tác giả, rồi map sang {@link PostResponse}.
     */
    @Override
    public PostResponse getPostDetail(Long id, boolean isAuthenticated, String viewerEmail) {
        Post post = loadViewablePost(id, isAuthenticated);
        UserProfile profile = userProfileRepository.findById(post.getUser().getId()).orElse(null);
        boolean liked = !computeLikedPostIds(viewerEmail, List.of(post.getId())).isEmpty();
        log.info("Xem chi tiết bài viết: id={}, guestMode={}", id, !isAuthenticated);
        return postMapper.toResponse(post, profile, liked);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng xử lý:
     * <ol>
     *   <li>Kiểm tra quyền xem bài viết chứa bình luận (tránh Guest đọc bình luận của bài MEMBERS).</li>
     *   <li>Kiểm tra tham số phân trang ({@code page} ≥ 0, {@code size} ≥ 1).</li>
     *   <li>Truy vấn trang bình luận ACTIVE (JOIN FETCH tác giả), batch-fetch hồ sơ tác giả (tránh N+1).</li>
     *   <li>Map từng bình luận sang {@link CommentResponse} rồi đóng gói vào {@link PageResponse}.</li>
     * </ol>
     */
    @Override
    public PageResponse<CommentResponse> getPostComments(Long postId, int page, int size, boolean isAuthenticated) {
        // Áp dụng cùng quy tắc quyền xem như xem chi tiết bài viết.
        loadViewablePost(postId, isAuthenticated);

        if (page < 0) {
            throw new BadRequestException("Tham số page phải là số nguyên không âm");
        }
        if (size <= 0) {
            throw new BadRequestException("Tham số size phải là số nguyên dương");
        }

        Page<Comment> commentsPage = commentRepository.findActiveByPostId(postId, PageRequest.of(page, size));
        log.info("Lấy bình luận: postId={}, page={}, size={}, tổng kết quả={}",
                postId, page, size, commentsPage.getTotalElements());

        // Gộp truy vấn hồ sơ tác giả theo lô (batch) thay vì truy vấn riêng lẻ cho từng bình luận.
        List<Long> authorIds = commentsPage.getContent().stream()
                .map(c -> c.getUser().getId())
                .distinct()
                .collect(Collectors.toList());
        Map<Long, UserProfile> profileByUserId = userProfileRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(UserProfile::getUserId, Function.identity()));

        List<CommentResponse> content = commentsPage.getContent().stream()
                .map(comment -> commentMapper.toResponse(comment, profileByUserId.get(comment.getUser().getId())))
                .collect(Collectors.toList());

        return PageResponse.<CommentResponse>builder()
                .content(content)
                .pageNumber(commentsPage.getNumber())
                .pageSize(commentsPage.getSize())
                .totalElements(commentsPage.getTotalElements())
                .totalPages(commentsPage.getTotalPages())
                .last(commentsPage.isLast())
                .build();
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng xử lý:
     * <ol>
     *   <li>Kiểm tra quyền bình luận: chỉ STUDENT/ALUMNI, vai trò khác bị từ chối 403.</li>
     *   <li>Nạp bài viết còn khả dụng — bài đã ẩn/không tồn tại trả 404 (qua {@link #loadViewablePost}).</li>
     *   <li>Nếu là trả lời: kiểm tra bình luận cha thuộc đúng bài và đang ACTIVE (xem {@link #resolveParentOrThrow}).</li>
     *   <li>Lưu bình luận ACTIVE và tăng bộ đếm {@code comment_count} của bài viết trong cùng transaction.</li>
     * </ol>
     */
    @Override
    @Transactional
    public CommentResponse createComment(String email, Long postId, CreateCommentRequest request) {
        User author = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được bình luận");
        Post post = loadViewablePost(postId, true);

        // Trả lời (tùy chọn): bình luận cha phải thuộc đúng bài viết này và đang hiển thị.
        Comment parent = resolveParentOrThrow(request.getParentId(), postId);

        Comment comment = commentRepository.save(Comment.builder()
                .post(post)
                .user(author)
                .parentComment(parent)
                .content(request.getContent().trim())
                .status(CommentStatus.ACTIVE)
                .build());

        // Bộ đếm denormalized trên bài viết — cập nhật cùng transaction với việc lưu bình luận.
        post.setCommentCount(post.getCommentCount() + 1);
        postRepository.save(post);

        log.info("Đăng bình luận: postId={}, commentId={}, userId={}, parentId={}, commentCount={}",
                postId, comment.getId(), author.getId(),
                parent != null ? parent.getId() : null, post.getCommentCount());

        UserProfile profile = userProfileRepository.findById(author.getId()).orElse(null);
        return commentMapper.toResponse(comment, profile);
    }

    /**
     * Kiểm tra và nạp bình luận cha khi người dùng trả lời một bình luận (UC18).
     * Bình luận cha phải tồn tại, đang ACTIVE và thuộc đúng bài viết đang được bình luận —
     * ngược lại coi như không còn khả dụng (404). Bảng {@code comments} chỉ hỗ trợ 1 cấp
     * trả lời nên nếu bình luận cha bản thân đã là trả lời thì quy chiếu về bình luận gốc.
     *
     * @param parentId ID bình luận cha, hoặc null nếu đây là bình luận gốc
     * @param postId   ID bài viết đang được bình luận
     * @return Bình luận cha hợp lệ (đã quy về gốc), hoặc null nếu không phải trả lời
     */
    private Comment resolveParentOrThrow(Long parentId, Long postId) {
        if (parentId == null) {
            return null;
        }
        Comment parent = commentRepository.findById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Bình luận cần trả lời không còn khả dụng"));
        if (parent.getStatus() != CommentStatus.ACTIVE || !postId.equals(parent.getPost().getId())) {
            throw new ResourceNotFoundException("Bình luận cần trả lời không còn khả dụng");
        }
        // Chỉ hỗ trợ 1 cấp: trả lời của một trả lời được gắn về đúng bình luận gốc.
        return parent.getParentComment() != null ? parent.getParentComment() : parent;
    }

    /**
     * {@inheritDoc}
     * <p>
     * Chỉ STUDENT/ALUMNI được thích (else 403); bài ẩn/không tồn tại → 404 (qua {@link #loadViewablePost}).
     * Lũy đẳng: nếu đã thích rồi thì không thêm nữa. Cập nhật bộ đếm like_count của bài viết.
     */
    @Override
    @Transactional
    public LikeResponse likePost(String email, Long postId) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được thích bài viết");
        Post post = loadViewablePost(postId, true);
        if (!postLikeRepository.existsByPostIdAndUserId(postId, user.getId())) {
            postLikeRepository.save(PostLike.builder().post(post).user(user).build());
            post.setLikeCount(post.getLikeCount() + 1);
            postRepository.save(post);
            log.info("Thích bài viết: postId={}, userId={}, likeCount={}", postId, user.getId(), post.getLikeCount());
        }
        return LikeResponse.builder().liked(true).likeCount(post.getLikeCount()).build();
    }

    /**
     * {@inheritDoc}
     * <p>
     * Chỉ STUDENT/ALUMNI được bỏ thích (else 403); bài ẩn/không tồn tại → 404.
     * Lũy đẳng: nếu chưa thích thì không thay đổi. Cập nhật bộ đếm like_count của bài viết.
     */
    @Override
    @Transactional
    public LikeResponse unlikePost(String email, Long postId) {
        User user = resolveMemberOrThrow(email, "Chỉ sinh viên và cựu sinh viên mới được thích bài viết");
        Post post = loadViewablePost(postId, true);
        if (postLikeRepository.existsByPostIdAndUserId(postId, user.getId())) {
            postLikeRepository.deleteByPostIdAndUserId(postId, user.getId());
            post.setLikeCount(Math.max(0, post.getLikeCount() - 1));
            postRepository.save(post);
            log.info("Bỏ thích bài viết: postId={}, userId={}, likeCount={}", postId, user.getId(), post.getLikeCount());
        }
        return LikeResponse.builder().liked(false).likeCount(post.getLikeCount()).build();
    }

    /**
     * Nạp tài khoản đang đăng nhập theo email và kiểm tra quyền tương tác với bài viết
     * (UC17 thích/bỏ thích, UC18 bình luận): chỉ STUDENT/ALUMNI được phép, vai trò khác
     * (VD Admin) bị từ chối với lỗi 403 kèm thông điệp phù hợp với hành động đang thực hiện.
     *
     * @param email            Email người dùng (từ JWT)
     * @param forbiddenMessage Thông điệp lỗi 403 tương ứng hành động (thích / bình luận)
     * @return User hợp lệ để thực hiện hành động
     */
    private User resolveMemberOrThrow(String email, String forbiddenMessage) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));
        String role = user.getRole() != null ? user.getRole().getName().toUpperCase() : "";
        if (!role.equals("STUDENT") && !role.equals("ALUMNI")) {
            throw new ForbiddenException(forbiddenMessage);
        }
        return user;
    }

    /**
     * Tính tập ID bài viết (trong danh sách cho trước) mà người xem hiện tại đã thích.
     * Trả về tập rỗng nếu là Guest ({@code viewerEmail} null) hoặc danh sách rỗng.
     *
     * @param viewerEmail Email người xem đã đăng nhập, hoặc null nếu là Guest
     * @param postIds     Tập ID bài viết cần kiểm tra
     * @return Tập ID bài viết mà người xem đã thích
     */
    private Set<Long> computeLikedPostIds(String viewerEmail, List<Long> postIds) {
        if (viewerEmail == null || postIds.isEmpty()) {
            return new HashSet<>();
        }
        return userRepository.findByEmail(viewerEmail)
                .<Set<Long>>map(u -> new HashSet<>(postLikeRepository.findLikedPostIds(u.getId(), postIds)))
                .orElseGet(HashSet::new);
    }

    /**
     * Nạp một bài viết theo ID và kiểm tra quyền xem, dùng chung cho cả xem chi tiết và xem bình luận:
     * <ul>
     *   <li>Không tồn tại hoặc đã bị ẩn (isHidden = true) → {@link ResourceNotFoundException} (404) — BR-08/BR-11.</li>
     *   <li>Guest (chưa đăng nhập) xem bài {@code MEMBERS} → {@link ForbiddenException} (403) — BR-12.</li>
     * </ul>
     *
     * @param id              ID bài viết cần nạp
     * @param isAuthenticated true nếu người xem đã đăng nhập, false nếu là Guest
     * @return Bài viết hợp lệ để xem (đã JOIN FETCH tác giả)
     */
    private Post loadViewablePost(Long id, boolean isAuthenticated) {
        Post post = postRepository.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bài viết này không còn khả dụng"));

        // BR-08/BR-11: bài đã bị Admin ẩn coi như không còn khả dụng (không tiết lộ là do bị ẩn).
        if (post.isHidden()) {
            throw new ResourceNotFoundException("Bài viết này không còn khả dụng");
        }

        // BR-12: Guest chỉ xem được bài PUBLIC; bài MEMBERS yêu cầu đăng nhập.
        if (!isAuthenticated && post.getVisibility() != PostVisibility.PUBLIC) {
            throw new ForbiddenException("Đăng nhập để xem bài viết này");
        }

        return post;
    }

    /**
     * Chuyển chuỗi loại bài viết (không phân biệt hoa/thường, do Frontend gửi chữ thường)
     * sang enum {@link PostType}.
     *
     * @param type Chuỗi loại bài viết từ query param, hoặc null/rỗng nếu không lọc
     * @return Enum tương ứng, hoặc null nếu không lọc theo loại
     * @throws BadRequestException nếu chuỗi truyền vào không khớp bất kỳ giá trị hợp lệ nào
     */
    private PostType parsePostType(String type) {
        if (type == null || type.isBlank()) {
            return null;
        }
        try {
            return PostType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Loại bài viết không hợp lệ: " + type);
        }
    }

    /**
     * Chuyển chuỗi phạm vi hiển thị (không phân biệt hoa/thường, Frontend gửi chữ thường)
     * sang enum {@link PostVisibility}.
     *
     * @param visibility Chuỗi "public"/"members", hoặc null/rỗng nếu dùng mặc định
     * @return Enum tương ứng, hoặc null nếu để trống (Service dùng mặc định PUBLIC)
     * @throws BadRequestException nếu chuỗi truyền vào không khớp bất kỳ phạm vi hợp lệ nào
     */
    private PostVisibility parsePostVisibility(String visibility) {
        if (visibility == null || visibility.isBlank()) {
            return null;
        }
        try {
            return PostVisibility.valueOf(visibility.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Phạm vi hiển thị không hợp lệ: " + visibility);
        }
    }
}
