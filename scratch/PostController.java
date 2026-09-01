package com.alumnect.alumnect_backend.controller.post;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.post.CreateCommentRequest;
import com.alumnect.alumnect_backend.dto.request.post.CreatePostRequest;
import com.alumnect.alumnect_backend.dto.request.post.EditPostRequest;
import com.alumnect.alumnect_backend.dto.request.post.RepostRequest;
import com.alumnect.alumnect_backend.dto.request.post.UpdateCommentRequest;
import com.alumnect.alumnect_backend.dto.request.report.CreatePostReportRequest;
import com.alumnect.alumnect_backend.dto.response.post.CommentResponse;
import com.alumnect.alumnect_backend.dto.response.post.LikeResponse;
import com.alumnect.alumnect_backend.dto.response.post.PostResponse;
import com.alumnect.alumnect_backend.dto.response.post.SavePostResponse;
import com.alumnect.alumnect_backend.dto.response.report.ReportResponse;
import com.alumnect.alumnect_backend.service.post.PostService;
import com.alumnect.alumnect_backend.service.report.ReportService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller xá»­ lĂ½ cĂ¡c yĂªu cáº§u liĂªn quan Ä‘áº¿n bĂ i viáº¿t cá»™ng Ä‘á»“ng
 * (UC15 - View community Feed, UC16 - View Post Detail).
 * ÄÆ°á»£c map tá»± Ä‘á»™ng vá»›i prefix global /api/v1/posts.
 * <p>
 * Endpoint Ä‘Æ°á»£c khai bĂ¡o cĂ´ng khai (xem {@link com.alumnect.alumnect_backend.security.Endpoints#PUBLIC_GET}) Ä‘á»ƒ
 * Guest chÆ°a Ä‘Äƒng nháº­p váº«n xem Ä‘Æ°á»£c báº£ng tin á»Ÿ cháº¿ Ä‘á»™ chá»‰ Ä‘á»c (BR-12);
 * {@link com.alumnect.alumnect_backend.security.filter.JwtFilter} váº«n giáº£i mĂ£ vĂ  gĂ¡n {@link Authentication}
 * vĂ o Security Context náº¿u request cĂ³ kĂ¨m Bearer token há»£p lá»‡, nhá» Ä‘Ă³ Controller phĂ¢n biá»‡t Ä‘Æ°á»£c
 * Guest vĂ  thĂ nh viĂªn Ä‘Ă£ Ä‘Äƒng nháº­p Ä‘á»ƒ lá»c dá»¯ liá»‡u phĂ¹ há»£p.
 */
@RestController
@RequestMapping("/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private ReportService reportService;

    /**
     * API láº¥y má»™t trang bĂ i viáº¿t trĂªn báº£ng tin cá»™ng Ä‘á»“ng.
     * Guest (khĂ´ng cĂ³/khĂ´ng kĂ¨m JWT há»£p lá»‡) chá»‰ nháº­n Ä‘Æ°á»£c bĂ i viáº¿t cĂ´ng khai (PUBLIC);
     * thĂ nh viĂªn Ä‘Ă£ Ä‘Äƒng nháº­p (Student/Alumni/Admin) nháº­n toĂ n bá»™ bĂ i viáº¿t chÆ°a bá»‹ áº©n.
     *
     * @param page           Sá»‘ thá»© tá»± trang cáº§n láº¥y (0-based), máº·c Ä‘á»‹nh 0
     * @param size           KĂ­ch thÆ°á»›c trang, máº·c Ä‘á»‹nh 5
     * @param sort           TiĂªu chĂ­ sáº¯p xáº¿p â€” hiá»‡n chá»‰ há»— trá»£ "recent" (má»›i nháº¥t trÆ°á»›c), tham sá»‘ dá»± phĂ²ng cho tÆ°Æ¡ng lai
     * @param type           Loáº¡i bĂ i viáº¿t cáº§n lá»c ("normal"/"achievement"/"recruitment"/"event"), bá» trá»‘ng náº¿u khĂ´ng lá»c
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c do Spring Security tá»± Ä‘á»™ng cung cáº¥p â€” null hoáº·c AnonymousAuthenticationToken náº¿u lĂ  Guest
     * @return Trang káº¿t quáº£ bĂ i viáº¿t {@link PostResponse} bá»c trong {@link ApiResponse}
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(defaultValue = "recent") String sort,
            @RequestParam(required = false) String type,
            Authentication authentication) {

        boolean authenticated = isAuthenticated(authentication);
        String viewerEmail = authenticated ? authentication.getName() : null;
        PageResponse<PostResponse> feed = postService.getFeed(page, size, type, authenticated, viewerEmail);
        return ResponseEntity.ok(ApiResponse.success("Láº¥y báº£ng tin thĂ nh cĂ´ng", feed));
    }

    /**
     * API láº¥y trang bĂ i viáº¿t cá»§a má»™t ngÆ°á»i dĂ¹ng cá»¥ thá»ƒ.
     *
     * @param userId         ID cá»§a ngÆ°á»i dĂ¹ng cáº§n láº¥y bĂ i viáº¿t
     * @param page           Sá»‘ thá»© tá»± trang (0-based)
     * @param size           KĂ­ch thÆ°á»›c trang
     * @param type           Loáº¡i bĂ i viáº¿t cáº§n lá»c
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c
     * @return Trang káº¿t quáº£ bĂ i viáº¿t
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getUserPosts(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String type,
            Authentication authentication) {

        boolean authenticated = isAuthenticated(authentication);
        String viewerEmail = authenticated ? authentication.getName() : null;
        PageResponse<PostResponse> userPosts = postService.getUserPosts(userId, page, size, type, authenticated, viewerEmail);
        return ResponseEntity.ok(ApiResponse.success("Láº¥y bĂ i viáº¿t cá»§a ngÆ°á»i dĂ¹ng thĂ nh cĂ´ng", userPosts));
    }

    /**
     * API táº¡o má»™t bĂ i viáº¿t má»›i trĂªn báº£ng tin cá»™ng Ä‘á»“ng (UC14 - Create a post on the Feed).
     * YĂªu cáº§u Ä‘Äƒng nháº­p (JWT); chá»‰ Sinh viĂªn/Cá»±u sinh viĂªn Ä‘Æ°á»£c Ä‘Äƒng bĂ i â€” Admin/vai trĂ² khĂ¡c nháº­n 403.
     * Guest chÆ°a Ä‘Äƒng nháº­p bá»‹ Spring Security cháº·n vá»›i 401 trÆ°á»›c khi vĂ o Controller.
     *
     * @param request        DTO chá»©a ná»™i dung, loáº¡i, áº£nh vĂ  pháº¡m vi hiá»ƒn thá»‹ cá»§a bĂ i viáº¿t
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c do Spring Security cung cáº¥p â€” dĂ¹ng láº¥y email tĂ¡c giáº£
     * @return BĂ i viáº¿t vá»«a táº¡o {@link PostResponse} bá»c trong {@link ApiResponse}, HTTP 201 Created
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @Valid @RequestBody CreatePostRequest request,
            Authentication authentication) {

        PostResponse created = postService.createPost(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("ÄÄƒng bĂ i viáº¿t thĂ nh cĂ´ng", created));
    }

    /**
     * API Ä‘Äƒng láº¡i má»™t bĂ i viáº¿t (UC21 - Repost a post).
     * YĂªu cáº§u Ä‘Äƒng nháº­p (JWT); chá»‰ Sinh viĂªn/Cá»±u sinh viĂªn Ä‘Æ°á»£c Ä‘Äƒng láº¡i.
     *
     * @param id             ID bĂ i viáº¿t cáº§n Ä‘Äƒng láº¡i
     * @param request        DTO chá»©a ná»™i dung Ä‘Äƒng láº¡i tĂ¹y chá»n
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c do Spring Security cung cáº¥p
     * @return BĂ i viáº¿t repost vá»«a táº¡o
     */
    @PostMapping("/{id}/repost")
    public ResponseEntity<ApiResponse<PostResponse>> repostPost(
            @PathVariable Long id,
            @RequestBody RepostRequest request,
            Authentication authentication) {
            
        PostResponse reposted = postService.repostPost(authentication.getName(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("ÄÄƒng láº¡i bĂ i viáº¿t thĂ nh cĂ´ng", reposted));
    }

    /**
     * API chá»‰nh sá»­a bĂ i viáº¿t Ä‘Ă£ Ä‘Äƒng (UC22 - Edit a post).
     * YĂªu cáº§u Ä‘Äƒng nháº­p (JWT); chá»‰ tĂ¡c giáº£ (Sinh viĂªn/Cá»±u sinh viĂªn) má»›i Ä‘Æ°á»£c sá»­a bĂ i
     * cá»§a chĂ­nh mĂ¬nh â€” ngÆ°á»i khĂ¡c hoáº·c Admin nháº­n 403.
     * Guest chÆ°a Ä‘Äƒng nháº­p bá»‹ Spring Security cháº·n vá»›i 401 trÆ°á»›c khi vĂ o Controller.
     *
     * @param id             ID bĂ i viáº¿t cáº§n chá»‰nh sá»­a
     * @param request        DTO chá»©a ná»™i dung má»›i, loáº¡i, áº£nh vĂ  pháº¡m vi hiá»ƒn thá»‹
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c do Spring Security cung cáº¥p â€” dĂ¹ng láº¥y email tĂ¡c giáº£
     * @return BĂ i viáº¿t Ä‘Ă£ Ä‘Æ°á»£c cáº­p nháº­t {@link PostResponse} bá»c trong {@link ApiResponse}, HTTP 200 OK
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> editPost(
            @PathVariable Long id,
            @Valid @RequestBody EditPostRequest request,
            Authentication authentication) {

        PostResponse updated = postService.editPost(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Chá»‰nh sá»­a bĂ i viáº¿t thĂ nh cĂ´ng", updated));
    }

    /**
     * API láº¥y chi tiáº¿t má»™t bĂ i viáº¿t theo ID (UC16 - View Post Detail).
     * Guest chá»‰ xem Ä‘Æ°á»£c bĂ i PUBLIC (bĂ i MEMBERS tráº£ 403); bĂ i Ä‘Ă£ áº©n/khĂ´ng tá»“n táº¡i tráº£ 404.
     *
     * @param id             ID bĂ i viáº¿t cáº§n xem chi tiáº¿t
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c do Spring Security cung cáº¥p â€” null/Anonymous náº¿u lĂ  Guest
     * @return Chi tiáº¿t bĂ i viáº¿t {@link PostResponse} bá»c trong {@link ApiResponse}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PostResponse>> getPostDetail(
            @PathVariable Long id,
            Authentication authentication) {

        boolean authenticated = isAuthenticated(authentication);
        String viewerEmail = authenticated ? authentication.getName() : null;
        PostResponse post = postService.getPostDetail(id, authenticated, viewerEmail);
        return ResponseEntity.ok(ApiResponse.success("Láº¥y chi tiáº¿t bĂ i viáº¿t thĂ nh cĂ´ng", post));
    }

    /**
     * API láº¥y má»™t trang bĂ¬nh luáº­n (chá»‰ Ä‘á»c) cá»§a má»™t bĂ i viáº¿t (UC16 - View Post Detail).
     * Ăp dá»¥ng cĂ¹ng quy táº¯c quyá»n xem nhÆ° xem chi tiáº¿t bĂ i viáº¿t.
     *
     * @param id             ID bĂ i viáº¿t cáº§n láº¥y bĂ¬nh luáº­n
     * @param page           Sá»‘ thá»© tá»± trang cáº§n láº¥y (0-based), máº·c Ä‘á»‹nh 0
     * @param size           KĂ­ch thÆ°á»›c trang, máº·c Ä‘á»‹nh 10
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c do Spring Security cung cáº¥p â€” null/Anonymous náº¿u lĂ  Guest
     * @return Trang bĂ¬nh luáº­n {@link CommentResponse} bá»c trong {@link ApiResponse}
     */
    @GetMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getPostComments(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        PageResponse<CommentResponse> comments = postService.getPostComments(id, page, size, isAuthenticated(authentication));
        return ResponseEntity.ok(ApiResponse.success("Láº¥y bĂ¬nh luáº­n thĂ nh cĂ´ng", comments));
    }

    /**
     * API Ä‘Äƒng má»™t bĂ¬nh luáº­n má»›i trĂªn bĂ i viáº¿t (UC18 - Comment on a post).
     * YĂªu cáº§u Ä‘Äƒng nháº­p (JWT); chá»‰ Sinh viĂªn/Cá»±u sinh viĂªn Ä‘Æ°á»£c bĂ¬nh luáº­n â€” vai trĂ² khĂ¡c nháº­n 403.
     * Guest chÆ°a Ä‘Äƒng nháº­p bá»‹ Spring Security cháº·n vá»›i 401 trÆ°á»›c khi vĂ o Controller.
     * BĂ i Ä‘Ă£ áº©n/khĂ´ng tá»“n táº¡i tráº£ 404; ná»™i dung rá»—ng/quĂ¡ dĂ i tráº£ 400.
     *
     * @param id             ID bĂ i viáº¿t Ä‘Æ°á»£c bĂ¬nh luáº­n
     * @param request        DTO chá»©a ná»™i dung bĂ¬nh luáº­n vĂ  {@code parentId} náº¿u lĂ  tráº£ lá»i
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c do Spring Security cung cáº¥p â€” dĂ¹ng láº¥y email tĂ¡c giáº£
     * @return BĂ¬nh luáº­n vá»«a táº¡o {@link CommentResponse} bá»c trong {@link ApiResponse}, HTTP 201 Created
     */
    @PostMapping("/{id}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> createComment(
            @PathVariable Long id,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication) {

        CommentResponse created = postService.createComment(authentication.getName(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("ÄÄƒng bĂ¬nh luáº­n thĂ nh cĂ´ng", created));
    }

    /**
     * API chá»‰nh sá»­a má»™t bĂ¬nh luáº­n Ä‘Ă£ Ä‘Äƒng (UC19 - Edit a comment).
     * YĂªu cáº§u JWT; chá»‰ Student/Alumni lĂ  tĂ¡c giáº£ bĂ¬nh luáº­n má»›i Ä‘Æ°á»£c sá»­a. Guest nháº­n 401, ngÆ°á»i dĂ¹ng
     * khĂ´ng pháº£i tĂ¡c giáº£ hoáº·c Admin nháº­n 403; bĂ¬nh luáº­n Ä‘Ă£ xĂ³a, khĂ´ng tá»“n táº¡i hoáº·c khĂ´ng thuá»™c bĂ i viáº¿t nháº­n 404.
     *
     * @param postId         ID bĂ i viáº¿t chá»©a bĂ¬nh luáº­n
     * @param commentId      ID bĂ¬nh luáº­n cáº§n chá»‰nh sá»­a
     * @param request        DTO chá»©a ná»™i dung má»›i
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c dĂ¹ng Ä‘á»ƒ láº¥y email tĂ¡c giáº£
     * @return BĂ¬nh luáº­n sau khi cáº­p nháº­t, bá»c trong {@link ApiResponse}
     */
    @PutMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long postId,
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateCommentRequest request,
            Authentication authentication) {

        CommentResponse updated = postService.updateComment(authentication.getName(), postId, commentId, request);
        return ResponseEntity.ok(ApiResponse.success("Chá»‰nh sá»­a bĂ¬nh luáº­n thĂ nh cĂ´ng", updated));
    }

    /**
     * API thĂ­ch má»™t bĂ i viáº¿t (UC17 - Like a post). YĂªu cáº§u Ä‘Äƒng nháº­p; chá»‰ STUDENT/ALUMNI Ä‘Æ°á»£c thĂ­ch
     * (Admin/vai trĂ² khĂ¡c nháº­n 403). BĂ i Ä‘Ă£ áº©n/khĂ´ng tá»“n táº¡i tráº£ 404. Thao tĂ¡c lÅ©y Ä‘áº³ng.
     *
     * @param id             ID bĂ i viáº¿t cáº§n thĂ­ch
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c do Spring Security cung cáº¥p â€” dĂ¹ng láº¥y email ngÆ°á»i dĂ¹ng
     * @return Tráº¡ng thĂ¡i like má»›i + sá»‘ lÆ°á»£t thĂ­ch {@link LikeResponse} bá»c trong {@link ApiResponse}
     */
    /**
     * API bĂ¡o cĂ¡o bĂ i viáº¿t vi pháº¡m (UC24). BĂ¡o cĂ¡o luĂ´n Ä‘Æ°á»£c lÆ°u á»Ÿ tráº¡ng thĂ¡i PENDING
     * vĂ  khĂ´ng tá»± Ä‘á»™ng thay Ä‘á»•i tráº¡ng thĂ¡i cá»§a bĂ i viáº¿t.
     */
    @PostMapping("/{id}/reports")
    public ResponseEntity<ApiResponse<ReportResponse>> reportPost(
            @PathVariable Long id,
            @Valid @RequestBody CreatePostReportRequest request,
            Authentication authentication) {

        ReportResponse report = reportService.reportPost(authentication.getName(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("ÄĂ£ gá»­i bĂ¡o cĂ¡o. ChĂºng tĂ´i sáº½ xem xĂ©t bĂ i viáº¿t nĂ y", report));
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<ApiResponse<LikeResponse>> likePost(
            @PathVariable Long id,
            Authentication authentication) {

        LikeResponse result = postService.likePost(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ thĂ­ch bĂ i viáº¿t", result));
    }

    /**
     * API bá» thĂ­ch má»™t bĂ i viáº¿t (UC17 - Like a post). YĂªu cáº§u Ä‘Äƒng nháº­p; chá»‰ STUDENT/ALUMNI.
     * BĂ i Ä‘Ă£ áº©n/khĂ´ng tá»“n táº¡i tráº£ 404. Thao tĂ¡c lÅ©y Ä‘áº³ng.
     *
     * @param id             ID bĂ i viáº¿t cáº§n bá» thĂ­ch
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c do Spring Security cung cáº¥p â€” dĂ¹ng láº¥y email ngÆ°á»i dĂ¹ng
     * @return Tráº¡ng thĂ¡i like má»›i + sá»‘ lÆ°á»£t thĂ­ch {@link LikeResponse} bá»c trong {@link ApiResponse}
     */
    @DeleteMapping("/{id}/like")
    public ResponseEntity<ApiResponse<LikeResponse>> unlikePost(
            @PathVariable Long id,
            Authentication authentication) {

        LikeResponse result = postService.unlikePost(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ bá» thĂ­ch bĂ i viáº¿t", result));
    }

    /**
     * API láº¥y danh sĂ¡ch bĂ i viáº¿t Ä‘Ă£ lÆ°u cá»§a ngÆ°á»i dĂ¹ng hiá»‡n táº¡i (UC20 - View Saved Posts).
     * YĂªu cáº§u Ä‘Äƒng nháº­p; chá»‰ STUDENT/ALUMNI Ä‘Æ°á»£c truy cáº­p â€” Admin/Guest nháº­n 403.
     *
     * @param page           Sá»‘ thá»© tá»± trang cáº§n láº¥y (0-based), máº·c Ä‘á»‹nh 0
     * @param size           KĂ­ch thÆ°á»›c trang, máº·c Ä‘á»‹nh 10
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c do Spring Security cung cáº¥p â€” dĂ¹ng láº¥y email ngÆ°á»i dĂ¹ng
     * @return Trang káº¿t quáº£ bĂ i viáº¿t Ä‘Ă£ lÆ°u {@link PostResponse} bá»c trong {@link ApiResponse}
     */
    @GetMapping("/saved")
    public ResponseEntity<ApiResponse<PageResponse<PostResponse>>> getSavedPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        if (!isAuthenticated(authentication)) {
            throw new com.alumnect.alumnect_backend.exception.ForbiddenException("Vui lĂ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ xem danh sĂ¡ch bĂ i viáº¿t Ä‘Ă£ lÆ°u");
        }
        PageResponse<PostResponse> savedPosts = postService.getSavedPosts(authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Láº¥y danh sĂ¡ch bĂ i viáº¿t Ä‘Ă£ lÆ°u thĂ nh cĂ´ng", savedPosts));
    }

    /**
     * API lÆ°u/Ä‘Ă¡nh dáº¥u (bookmark) má»™t bĂ i viáº¿t (UC20 - Save Post).
     * YĂªu cáº§u Ä‘Äƒng nháº­p; chá»‰ STUDENT/ALUMNI Ä‘Æ°á»£c lÆ°u bĂ i viáº¿t (Admin/vai trĂ² khĂ¡c nháº­n 403).
     * BĂ i Ä‘Ă£ áº©n/xĂ³a/khĂ´ng tá»“n táº¡i tráº£ 404. Thao tĂ¡c cĂ³ tĂ­nh lÅ©y Ä‘áº³ng.
     *
     * @param id             ID bĂ i viáº¿t cáº§n lÆ°u
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c do Spring Security cung cáº¥p â€” dĂ¹ng láº¥y email ngÆ°á»i dĂ¹ng
     * @return Tráº¡ng thĂ¡i lÆ°u má»›i {@link SavePostResponse} bá»c trong {@link ApiResponse}
     */
    @PostMapping("/{id}/save")
    public ResponseEntity<ApiResponse<SavePostResponse>> savePost(
            @PathVariable Long id,
            Authentication authentication) {

        if (!isAuthenticated(authentication)) {
            throw new com.alumnect.alumnect_backend.exception.ForbiddenException("Vui lĂ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ lÆ°u bĂ i viáº¿t");
        }
        SavePostResponse result = postService.savePost(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ lÆ°u bĂ i viáº¿t thĂ nh cĂ´ng", result));
    }

    /**
     * API bá» lÆ°u/bá» Ä‘Ă¡nh dáº¥u má»™t bĂ i viáº¿t (UC20 - Save Post).
     * YĂªu cáº§u Ä‘Äƒng nháº­p; chá»‰ STUDENT/ALUMNI Ä‘Æ°á»£c bá» lÆ°u bĂ i viáº¿t.
     * BĂ i Ä‘Ă£ áº©n/xĂ³a/khĂ´ng tá»“n táº¡i tráº£ 404. Thao tĂ¡c cĂ³ tĂ­nh lÅ©y Ä‘áº³ng.
     *
     * @param id             ID bĂ i viáº¿t cáº§n bá» lÆ°u
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c do Spring Security cung cáº¥p â€” dĂ¹ng láº¥y email ngÆ°á»i dĂ¹ng
     * @return Tráº¡ng thĂ¡i lÆ°u má»›i {@link SavePostResponse} bá»c trong {@link ApiResponse}
     */
    @DeleteMapping("/{id}/save")
    public ResponseEntity<ApiResponse<SavePostResponse>> unsavePost(
            @PathVariable Long id,
            Authentication authentication) {

        if (!isAuthenticated(authentication)) {
            throw new com.alumnect.alumnect_backend.exception.ForbiddenException("Vui lĂ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ bá» lÆ°u bĂ i viáº¿t");
        }
        SavePostResponse result = postService.unsavePost(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("ÄĂ£ bá» lÆ°u bĂ i viáº¿t thĂ nh cĂ´ng", result));
    }

    /**
     * API xĂ³a má»™t bĂ i viáº¿t Ä‘Ă£ Ä‘Äƒng (UC23 - Delete a post).
     * YĂªu cáº§u Ä‘Äƒng nháº­p (JWT); chá»‰ tĂ¡c giáº£ (Sinh viĂªn/Cá»±u sinh viĂªn) má»›i Ä‘Æ°á»£c xĂ³a bĂ i
     * cá»§a chĂ­nh mĂ¬nh â€” ngÆ°á»i khĂ¡c hoáº·c Admin nháº­n 403.
     * BĂ i Ä‘Ă£ xĂ³a/khĂ´ng tá»“n táº¡i tráº£ 404.
     *
     * @param id             ID bĂ i viáº¿t cáº§n xĂ³a
     * @param authentication ThĂ´ng tin xĂ¡c thá»±c do Spring Security cung cáº¥p â€” dĂ¹ng láº¥y email tĂ¡c giáº£
     * @return {@link ApiResponse} rá»—ng vá»›i tráº¡ng thĂ¡i thĂ nh cĂ´ng, HTTP 200 OK
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long id,
            Authentication authentication) {

        postService.deletePost(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("XĂ³a bĂ i viáº¿t thĂ nh cĂ´ng", null));
    }

    /**
     * XĂ¡c Ä‘á»‹nh ngÆ°á»i gá»i Ä‘Ă£ Ä‘Äƒng nháº­p hay lĂ  Guest dá»±a trĂªn {@link Authentication} do Spring Security cung cáº¥p.
     *
     * @param authentication Äá»‘i tÆ°á»£ng xĂ¡c thá»±c â€” null hoáº·c {@link AnonymousAuthenticationToken} náº¿u lĂ  Guest
     * @return true náº¿u Ä‘Ă£ Ä‘Äƒng nháº­p (cĂ³ JWT há»£p lá»‡), false náº¿u lĂ  Guest
     */
    private boolean isAuthenticated(Authentication authentication) {
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
    }
}
