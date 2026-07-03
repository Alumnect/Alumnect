package com.alumnect.alumnect_backend.service.post;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.PostType;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.mapper.post.PostMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
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
    private PostMapper postMapper;

    /**
     * {@inheritDoc}
     * <p>
     * Luồng xử lý:
     * <ol>
     *   <li>Chuyển chuỗi {@code type} (nếu có) sang enum {@link PostType}, ném lỗi 400 nếu giá trị không hợp lệ.</li>
     *   <li>Truy vấn trang bài viết qua {@link PostRepository#findFeed}, đã JOIN FETCH sẵn tác giả (User) để tránh N+1 query.</li>
     *   <li>Truy vấn gộp (batch) hồ sơ {@link UserProfile} của toàn bộ tác giả xuất hiện trong trang — tránh N+1 query lần 2.</li>
     *   <li>Map từng bài viết sang {@link PostResponse} rồi đóng gói vào {@link PageResponse}.</li>
     * </ol>
     */
    @Override
    public PageResponse<PostResponse> getFeed(int page, int size, String type, boolean isAuthenticated) {
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

        List<PostResponse> content = postsPage.getContent().stream()
                .map(post -> postMapper.toResponse(post, profileByUserId.get(post.getUser().getId())))
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
}
