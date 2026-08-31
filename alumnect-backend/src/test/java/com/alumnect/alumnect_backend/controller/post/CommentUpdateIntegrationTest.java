package com.alumnect.alumnect_backend.controller.post;

import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.AuthProvider;
import com.alumnect.alumnect_backend.common.enums.CommentStatus;
import com.alumnect.alumnect_backend.common.enums.PostCategory;
import com.alumnect.alumnect_backend.common.enums.PostStatus;
import com.alumnect.alumnect_backend.dao.post.CommentRepository;
import com.alumnect.alumnect_backend.dao.post.PostRepository;
import com.alumnect.alumnect_backend.dao.user.RoleRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.post.UpdateCommentRequest;
import com.alumnect.alumnect_backend.entity.post.Comment;
import com.alumnect.alumnect_backend.entity.post.Post;
import com.alumnect.alumnect_backend.entity.user.Role;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.service.post.PostService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.Validator;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Kiểm thử tích hợp UC19 qua Service → JPA và các ràng buộc DTO.
 * Mỗi ca chạy trong transaction rollback để không giữ lại user/post/comment kiểm thử trong database.
 */
@SpringBootTest
@Transactional
class CommentUpdateIntegrationTest {

    @Autowired
    private PostService postService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private Validator validator;

    /** Xác nhận tác giả Student chỉnh sửa thành công và dữ liệu thật đã được cập nhật. */
    @Test
    void updateComment_shouldUpdateOwnActiveComment() throws Exception {
        Fixture fixture = createFixture();

        var response = postService.updateComment(
                fixture.author().getEmail(),
                fixture.post().getId(),
                fixture.comment().getId(),
                UpdateCommentRequest.builder().content("  Nội dung đã cập nhật  ").build());

        assertThat(response.getId()).isEqualTo(String.valueOf(fixture.comment().getId()));
        assertThat(response.getText()).isEqualTo("Nội dung đã cập nhật");

        assertThat(commentRepository.findById(fixture.comment().getId()))
                .hasValueSatisfying(comment -> assertThat(comment.getContent()).isEqualTo("Nội dung đã cập nhật"));
    }

    /** Chỉ tác giả mới được sửa; thành viên khác phải nhận HTTP 403. */
    @Test
    void updateComment_shouldRejectAnotherMember() {
        Fixture fixture = createFixture();
        User anotherStudent = createStudent();

        assertThatThrownBy(() -> postService.updateComment(
                anotherStudent.getEmail(),
                fixture.post().getId(),
                fixture.comment().getId(),
                UpdateCommentRequest.builder().content("Nội dung không được phép sửa").build()))
                .isInstanceOf(ForbiddenException.class)
                .hasMessage("Bạn chỉ được chỉnh sửa bình luận của chính mình");
    }

    /** Nội dung chỉ gồm khoảng trắng phải bị validation chặn với HTTP 400. */
    @Test
    void updateComment_shouldRejectBlankContent() {
        var violations = validator.validate(UpdateCommentRequest.builder().content("   ").build());

        assertThat(violations)
                .anySatisfy(violation -> assertThat(violation.getMessage())
                        .isEqualTo("Nội dung bình luận không được để trống"));
    }

    /** Tạo dữ liệu nền tối thiểu cho một bình luận ACTIVE thuộc một bài viết ACTIVE. */
    private Fixture createFixture() {
        User author = createStudent();
        Post post = postRepository.save(Post.builder()
                .author(author)
                .category(PostCategory.GENERAL)
                .content("Bài viết kiểm thử UC19")
                .status(PostStatus.ACTIVE)
                .build());
        Comment comment = commentRepository.save(Comment.builder()
                .post(post)
                .user(author)
                .content("Bình luận ban đầu")
                .status(CommentStatus.ACTIVE)
                .build());
        return new Fixture(author, post, comment);
    }

    /** Tạo Student ACTIVE có email duy nhất để JwtFilter xác thực như người dùng thật. */
    private User createStudent() {
        Role studentRole = roleRepository.findByName("STUDENT")
                .orElseThrow(() -> new IllegalStateException("Thiếu role STUDENT trong dữ liệu Flyway"));
        String email = "uc19-" + UUID.randomUUID() + "@example.test";
        return userRepository.save(User.builder()
                .email(email)
                .passwordHash("not-used-by-this-test")
                .role(studentRole)
                .accountStatus(AccountStatus.ACTIVE)
                .isAccountVerified(true)
                .emailVerified(true)
                .authProvider(AuthProvider.LOCAL)
                .build());
    }

    /** Gói dữ liệu cần thiết cho mỗi ca kiểm thử. */
    private record Fixture(User author, Post post, Comment comment) {
    }
}
