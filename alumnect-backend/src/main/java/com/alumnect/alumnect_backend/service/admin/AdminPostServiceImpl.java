package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dto.response.admin.AdminPostResponse;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.admin.AdminPostMapper;
import com.alumnect.alumnect_backend.specification.post.PostSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Lớp dịch vụ thực thi logic quản lý và kiểm duyệt bài viết của Admin.
 */
@Service
@RequiredArgsConstructor
public class AdminPostServiceImpl implements AdminPostService {

    private final PostRepository postRepository;
    private final AdminPostMapper adminPostMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminPostResponse> getPosts(String query, String author, String status, String type, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Specification<Post> spec = PostSpecification.filterPosts(query, author, status, type);
        
        Page<Post> postPage = postRepository.findAll(spec, pageable);
        
        List<AdminPostResponse> dtoList = postPage.getContent().stream()
                .map(adminPostMapper::toDto)
                .collect(Collectors.toList());

        return PageResponse.<AdminPostResponse>builder()
                .content(dtoList)
                .totalElements(postPage.getTotalElements())
                .totalPages(postPage.getTotalPages())
                .pageSize(postPage.getSize())
                .pageNumber(postPage.getNumber())
                .last(postPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public void togglePostHidden(Long id, boolean isHidden) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với ID: " + id));
        
        post.setStatus(isHidden ? PostStatus.HIDDEN : PostStatus.ACTIVE);
        postRepository.save(post);
    }
}
