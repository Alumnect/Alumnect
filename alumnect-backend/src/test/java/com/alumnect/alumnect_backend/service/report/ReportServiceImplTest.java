package com.alumnect.alumnect_backend.service.report;

import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.report.ReportRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.report.CreatePostReportRequest;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.mapper.report.ReportMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

    @Mock
    private ReportRepository reportRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ReportMapper reportMapper;

    @InjectMocks
    private ReportServiceImpl reportService;

    @Test
    void reportPost_rejectsReportingOwnPost() {
        User reporter = User.builder()
                .id(11L)
                .email("student@example.com")
                .role(Role.builder().name("STUDENT").build())
                .build();
        Post ownPost = Post.builder()
                .id(5L)
                .author(reporter)
                .status(PostStatus.ACTIVE)
                .build();
        CreatePostReportRequest request = new CreatePostReportRequest();
        request.setReason("SPAM");

        when(userRepository.findByEmail(reporter.getEmail())).thenReturn(Optional.of(reporter));
        when(postRepository.findDetailById(ownPost.getId())).thenReturn(Optional.of(ownPost));

        ForbiddenException exception = assertThrows(
                ForbiddenException.class,
                () -> reportService.reportPost(reporter.getEmail(), ownPost.getId(), request));

        assertEquals("Bạn không thể báo cáo bài viết của chính mình", exception.getMessage());
        verify(reportRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
