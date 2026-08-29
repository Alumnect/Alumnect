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
import com.alumnect.alumnect_backend.dao.job.JobPostingRepository;
import com.alumnect.alumnect_backend.dao.event.EventRepository;
import com.alumnect.alumnect_backend.entity.job.JobPosting;
import com.alumnect.alumnect_backend.entity.event.Event;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Lớp dịch vụ thực thi logic quản lý và kiểm duyệt bài viết của Admin.
 */
@Service
@RequiredArgsConstructor
public class AdminPostServiceImpl implements AdminPostService {

    private final PostRepository postRepository;
    private final AdminPostMapper adminPostMapper;
    private final JobPostingRepository jobPostingRepository;
    private final EventRepository eventRepository;


    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminPostResponse> getPosts(String query, String author, String status, String type, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Specification<Post> spec = PostSpecification.filterPosts(query, author, status, type);
        
        Page<Post> postPage = postRepository.findAll(spec, pageable);
        List<Post> posts = postPage.getContent();
        if (posts.isEmpty()) {
            return PageResponse.<AdminPostResponse>builder()
                    .content(List.of())
                    .totalElements(postPage.getTotalElements())
                    .totalPages(postPage.getTotalPages())
                    .pageSize(postPage.getSize())
                    .pageNumber(postPage.getNumber())
                    .last(postPage.isLast())
                    .build();
        }

        // Batch-fetch Jobs and Events to avoid N+1 queries
        List<Long> jobIds = posts.stream()
                .filter(p -> p.getJobId() != null).map(Post::getJobId).distinct().toList();
        List<Long> eventIds = posts.stream()
                .filter(p -> p.getEventId() != null).map(Post::getEventId).distinct().toList();
        Map<Long, JobPosting> jobById = jobIds.isEmpty() ? Map.of() :
                jobPostingRepository.findAllById(jobIds).stream().collect(Collectors.toMap(
                        JobPosting::getId, Function.identity()));
        Map<Long, Event> eventById = eventIds.isEmpty() ? Map.of() :
                eventRepository.findAllById(eventIds).stream().collect(Collectors.toMap(
                        Event::getId, Function.identity()));

        List<AdminPostResponse> dtoList = posts.stream()
                .map(p -> adminPostMapper.toDto(p, jobById.get(p.getJobId()), eventById.get(p.getEventId())))
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

    /**
     * Lấy thông tin chi tiết bài viết cộng đồng dành cho Admin (UC67).
     * Mô tả chi tiết: Tìm kiếm bài viết bằng ID thông qua Repository (đã nạp trước thông tin tác giả và mediaList),
     * nếu không tìm thấy sẽ ném ngoại lệ ResourceNotFoundException, ngược lại chuyển đổi sang DTO để trả về.
     *
     * @param id ID bài viết cần lấy chi tiết
     * @return DTO chứa thông tin chi tiết bài viết cộng đồng dành cho Admin
     */
    @Override
    @Transactional(readOnly = true)
    public AdminPostResponse getPostDetail(Long id) {
        // Tìm kiếm chi tiết bài viết kèm thông tin tác giả và hình ảnh đính kèm
        Post post = postRepository.findDetailById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài viết với ID: " + id));
        
        JobPosting job = post.getJobId() != null ? jobPostingRepository.findById(post.getJobId()).orElse(null) : null;
        Event event = post.getEventId() != null ? eventRepository.findById(post.getEventId()).orElse(null) : null;

        // Chuyển đổi từ thực thể Post sang DTO phản hồi
        return adminPostMapper.toDto(post, job, event);
    }
}
