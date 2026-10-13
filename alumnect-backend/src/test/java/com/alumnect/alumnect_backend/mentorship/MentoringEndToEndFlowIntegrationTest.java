package com.alumnect.alumnect_backend.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringParticipationType;
import com.alumnect.alumnect_backend.common.enums.MentoringTaskType;
import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.common.enums.ProposalSource;
import com.alumnect.alumnect_backend.config.MentoringProperties;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.CreateTaskPaymentRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.ProposeDealRequest;
import com.alumnect.alumnect_backend.dto.request.mentorship.RespondMentoringRequestRequest;
import com.alumnect.alumnect_backend.dto.request.message.SendMessageRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.CreateMentoringRequestResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorIncomingRequestDetailResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringConversationResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringTaskPaymentCheckoutResponse;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ConflictException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.integration.payos.PayOSGateway;
import com.alumnect.alumnect_backend.service.mentorship.MentoringChatContextService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringDealService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringRequestService;
import com.alumnect.alumnect_backend.service.mentorship.MentoringTaskPaymentService;
import com.alumnect.alumnect_backend.service.message.ChatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;
import vn.payos.model.webhooks.Webhook;
import vn.payos.model.webhooks.WebhookData;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Kiểm thử tích hợp end-to-end chuỗi nghiệp vụ Mentoring trên PostgreSQL thật (database alumnect_test):
 * Request → Mentor Response → Chat for Task → Deal → Payment → Task.
 * Thiết kế mới: Chỉ chốt Mentor thắng cuộc và đóng các lựa chọn khác SAU KHI thanh toán thành công.
 */
@SpringBootTest
class MentoringEndToEndFlowIntegrationTest {

    @DynamicPropertySource
    static void testDatabase(DynamicPropertyRegistry registry) {
        String host = System.getenv().getOrDefault("TEST_DB_HOST", "localhost");
        String port = System.getenv().getOrDefault("TEST_DB_PORT", "5432");
        registry.add("spring.datasource.url", () -> "jdbc:postgresql://" + host + ":" + port + "/alumnect_test");
        registry.add("spring.datasource.username", () -> System.getenv().getOrDefault("TEST_DB_USER", "postgres"));
        registry.add("spring.datasource.password", () -> System.getenv().getOrDefault("TEST_DB_PASSWORD", "postgres"));
        registry.add("spring.jpa.show-sql", () -> "false");
        registry.add("logging.level.org.flywaydb", () -> "INFO");
    }

    @Autowired private JdbcTemplate jdbc;
    @Autowired private WebApplicationContext webContext;
    @Autowired private MentoringProperties mentoringProperties;
    @Autowired private MentoringRequestService requestService;
    @Autowired private MentoringDealService dealService;
    @Autowired private MentoringTaskPaymentService paymentService;
    @Autowired private MentoringChatContextService chatContextService;
    @Autowired private ChatService chatService;

    @MockitoBean private PayOSGateway payOSGateway;

    private MockMvc mockMvc;

    /** Tài khoản kiểm thử: id + email */
    record Account(long id, String email) { }

    /** Mentor kiểm thử: tài khoản + mentor_profiles.id */
    record MentorAccount(long id, String email, long profileId) { }

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webContext).apply(springSecurity()).build();
        CreatePaymentLinkResponse link = mock(CreatePaymentLinkResponse.class);
        when(link.getPaymentLinkId()).thenAnswer(inv -> "link-" + UUID.randomUUID());
        when(link.getCheckoutUrl()).thenReturn("https://pay.payos.vn/web/test");
        when(link.getQrCode()).thenReturn("00020101021238570010A000000727");
        when(link.getDescription()).thenReturn("TASK TEST");
        when(payOSGateway.createPaymentLink(any())).thenReturn(link);
    }

    // =====================================================================
    // SCENARIOS
    // =====================================================================

    @Test
    @DisplayName("GENERAL request cũ hiển thị cho Mentor đăng ký sau và lọc được theo ngành/hình thức")
    void generalRequestIsVisibleToMentorsRegisteredLater() {
        Account student = createStudent();
        long requestIndustry = createIndustry();
        long otherIndustry = createIndustry();
        long requestId = createGeneralRequest(student, requestIndustry);

        MentorAccount sameIndustryMentor = createMentor(requestIndustry);
        MentorAccount otherIndustryMentor = createMentor(otherIndustry);

        var allForOtherIndustry = requestService.getIncomingRequests(
                otherIndustryMentor.email(), null, null, "ALL", 0, 20);
        assertThat(allForOtherIndustry.getContent())
                .anySatisfy(item -> {
                    assertThat(item.getId()).isEqualTo(requestId);
                    assertThat(item.isSameIndustry()).isFalse();
                    assertThat(item.isSameFormat()).isTrue();
                    assertThat(item.getDistributionId()).isNull();
                });

        var sameIndustryOnly = requestService.getIncomingRequests(
                otherIndustryMentor.email(), null, null, "SAME_INDUSTRY", 0, 20);
        assertThat(sameIndustryOnly.getContent()).noneMatch(item -> item.getId().equals(requestId));

        var sameFormatOnly = requestService.getIncomingRequests(
                otherIndustryMentor.email(), null, null, "SAME_FORMAT", 0, 20);
        assertThat(sameFormatOnly.getContent()).anyMatch(item -> item.getId().equals(requestId));

        var sameIndustryAfterRegistration = requestService.getIncomingRequests(
                sameIndustryMentor.email(), null, null, "SAME_INDUSTRY", 0, 20);
        assertThat(sameIndustryAfterRegistration.getContent())
                .anyMatch(item -> item.getId().equals(requestId) && item.isSameIndustry());

        MentorIncomingRequestDetailResponse detail = requestService.getIncomingRequestDetail(
                sameIndustryMentor.email(), requestId);
        assertThat(detail.getDistributionId()).isNull();
        assertThat(detail.isCanRespond()).isTrue();

        MentorIncomingRequestDetailResponse accepted = accept(sameIndustryMentor, requestId);
        assertThat(accepted.getDistributionId()).isNotNull();
        assertThat(accepted.getResponseStatus()).isEqualTo("ACCEPTED");
    }

    @Test
    @DisplayName("A: General Request → Mentor A ACCEPT → Chat → Deal → Student confirm → Payment success → đúng 1 Task")
    void scenarioA_generalRequestHappyPath() throws Exception {
        Account student = createStudent();
        long industry = createIndustry();
        MentorAccount mentorA = createMentor(industry);

        long requestId = createGeneralRequest(student, industry);
        assertThat(distributionStatus(requestId, mentorA)).isEqualTo("PENDING");

        MentorIncomingRequestDetailResponse accepted = accept(mentorA, requestId);
        long convId = accepted.getConversationId();
        assertThat(jdbc.queryForObject("SELECT mentoring_task_id FROM conversations WHERE id = ?", Long.class, convId)).isNull();
        assertThat(countSystemMessages(convId, "đã đồng ý trao đổi về Request của bạn")).isEqualTo(1);

        MentoringDealResponse deal = proposeByRequest(mentorA, convId);
        assertThat(deal.getVersion()).isEqualTo(1);
        assertThat(deal.getProposalSource()).isEqualTo(ProposalSource.REQUEST_ACCEPTANCE);
        assertThat(deal.getMentorConfirmed()).isTrue();
        assertThat(deal.getRequestId()).isEqualTo(requestId);
        assertThat(deal.getConversationId()).isEqualTo(convId);
        assertThat(deal.getAgreedPrice()).isEqualByComparingTo("500000");

        MentoringDealResponse confirmed = dealService.confirmDeal(student.id(), deal.getId(), 1);
        assertThat(confirmed.getStatus().name()).isEqualTo("DEAL_CONFIRMED");
        assertThat(confirmed.getIsLocked()).isTrue();
        assertThat(countTasksForDeal(deal.getId())).as("Không tạo Task khi chỉ confirm Deal").isZero();

        // Thiết kế mới: Khi confirm, Request vẫn OPEN, chưa chốt Mentor
        assertThat(requestRow(requestId, "status")).isEqualTo("OPEN");
        assertThat(requestLong(requestId, "selected_mentor_id")).isNull();

        long orderCode = pay(student, deal.getId());
        webhookSuccess(orderCode, 500000L);

        // Sau thanh toán thành công: Chốt Mentor và đóng Request
        assertThat(countTasksForDeal(deal.getId())).isEqualTo(1);
        long taskId = jdbc.queryForObject("SELECT id FROM mentoring_tasks WHERE deal_id = ?", Long.class, deal.getId());
        assertThat(jdbc.queryForObject("SELECT request_id FROM mentoring_tasks WHERE id = ?", Long.class, taskId)).isEqualTo(requestId);
        assertThat(jdbc.queryForObject("SELECT conversation_id FROM mentoring_tasks WHERE id = ?", Long.class, taskId)).isEqualTo(convId);
        assertThat(jdbc.queryForObject("SELECT mentor_id FROM mentoring_tasks WHERE id = ?", Long.class, taskId)).isEqualTo(mentorA.id());
        assertThat(jdbc.queryForObject("SELECT status FROM mentoring_tasks WHERE id = ?", String.class, taskId)).isEqualTo("PREPARATION");
        assertThat(jdbc.queryForObject("SELECT task_id FROM mentoring_task_payments WHERE order_code = ?", Long.class, orderCode)).isEqualTo(taskId);
        assertThat(jdbc.queryForObject("SELECT mentoring_task_id FROM conversations WHERE id = ?", Long.class, convId)).isEqualTo(taskId);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM conversations WHERE mentoring_request_id = ?", Integer.class, requestId)).isEqualTo(1);
        assertThat(requestRow(requestId, "status")).isEqualTo("CLOSED");
        assertThat(requestLong(requestId, "selected_mentor_id")).isEqualTo(mentorA.id());
        assertThat(countSystemMessages(convId, "Thanh toán thành công, Task đã được kích hoạt")).isEqualTo(1);

        // Kiểm tra sổ quỹ giao dịch (Escrow Collection)
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM mentoring_payment_ledgers WHERE request_id = ? AND transaction_type = 'ESCROW_COLLECTION' AND status = 'SUCCEEDED'",
                Integer.class, requestId)).isEqualTo(1);

        MentoringConversationResponse ctx = chatContextService.getConversationContext(student.id(), convId);
        assertThat(ctx.getTaskId()).isEqualTo(taskId);
        assertThat(ctx.isReadOnly()).isFalse();
        assertThat(ctx.getLatestPayment().getPaymentStatus().name()).isEqualTo("PAID");
    }

    @Test
    @DisplayName("B: Mentor A & B ACCEPT → 2 Chat riêng → Student confirm Deal B nhưng chỉ đóng Chat A sau khi thanh toán Deal B")
    void scenarioB_competingMentors() throws Exception {
        Account student = createStudent();
        long industry = createIndustry();
        MentorAccount mentorA = createMentor(industry);
        MentorAccount mentorB = createMentor(industry);
        MentorAccount mentorC = createMentor(industry);
        long requestId = createGeneralRequest(student, industry);

        long convA = accept(mentorA, requestId).getConversationId();
        long convB = accept(mentorB, requestId).getConversationId();
        assertThat(convA).isNotEqualTo(convB);

        MentoringDealResponse dealA = proposeByRequest(mentorA, convA);
        MentoringDealResponse dealB = renegotiate(mentorB, convB, new BigDecimal("450000"));

        dealService.confirmDeal(student.id(), dealB.getId(), dealB.getVersion());

        // Thiết kế mới: Trước khi thanh toán, Chat A vẫn CHƯA bị chuyển sang read-only
        MentoringConversationResponse ctxABeforePay = chatContextService.getConversationContext(mentorA.id(), convA);
        assertThat(ctxABeforePay.isReadOnly()).isFalse();
        assertThat(dealStatus(dealA.getId())).isNotEqualTo("CANCELLED");

        // Tiến hành thanh toán Deal B thành công
        long orderCode = pay(student, dealB.getId());
        webhookSuccess(orderCode, 450000L);

        // Sau thanh toán thành công: Chat A chuyển chỉ đọc, Deal A bị CANCELLED
        MentoringConversationResponse ctxAAfterPay = chatContextService.getConversationContext(mentorA.id(), convA);
        assertThat(ctxAAfterPay.isReadOnly()).isTrue();
        assertThat(ctxAAfterPay.getReadOnlyReason()).isEqualTo("Request đã chọn Mentor khác.");
        assertThat(ctxAAfterPay.isCanCreateDealTicket()).isFalse();
        assertThat(countSystemMessages(convA, "Request đã chọn Mentor khác.")).isEqualTo(1);
        assertThat(dealStatus(dealA.getId())).isEqualTo("CANCELLED");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM mentoring_deal_snapshots WHERE deal_id = ?", Integer.class, dealA.getId()))
                .as("Không xóa lịch sử Deal của Mentor thua").isEqualTo(1);

        // Backend chặn Mentor A: tạo Deal mới, gửi tin nhắn
        assertThatThrownBy(() -> renegotiate(mentorA, convA, new BigDecimal("300000"))).isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> chatService.sendMessage(mentorA.email(),
                SendMessageRequest.builder().conversationId(convA).content("Xin chào").build()))
                .isInstanceOf(ConflictException.class);

        // Mentor C chưa phản hồi bị EXPIRED
        assertThat(distributionStatus(requestId, mentorC)).isEqualTo("EXPIRED");
        assertThatThrownBy(() -> accept(mentorC, requestId)).isInstanceOf(BadRequestException.class);

        assertThat(jdbc.queryForObject("SELECT mentor_id FROM mentoring_tasks WHERE deal_id = ?", Long.class, dealB.getId())).isEqualTo(mentorB.id());
        assertThat(countTasksForDeal(dealA.getId())).isZero();
    }

    @Test
    @DisplayName("C: Direct Request (UC101) → Mentor đích ACCEPT → Chat → Deal → Payment → Task")
    void scenarioC_directRequest() throws Exception {
        Account student = createStudent();
        long industry = createIndustry();
        MentorAccount target = createMentor(industry);
        MentorAccount other = createMentor(industry);

        CreateMentoringRequestResponse created = requestService.createMentoringRequest(student.email(), requestPayload(industry, target.profileId()));
        long requestId = created.getId();
        assertThat(created.getRequestType().name()).isEqualTo("DIRECT");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM mentoring_request_distributions WHERE request_id = ?", Integer.class, requestId)).isEqualTo(1);
        assertThatThrownBy(() -> accept(other, requestId)).isInstanceOf(ForbiddenException.class);

        long convId = accept(target, requestId).getConversationId();
        MentoringDealResponse deal = proposeByRequest(target, convId);
        dealService.confirmDeal(student.id(), deal.getId(), deal.getVersion());
        long orderCode = pay(student, deal.getId());
        webhookSuccess(orderCode, 500000L);

        assertThat(countTasksForDeal(deal.getId())).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT request_id FROM mentoring_tasks WHERE deal_id = ?", Long.class, deal.getId())).isEqualTo(requestId);
    }

    @Test
    @DisplayName("D: Mentor ACCEPT gọi 2 lần (tuần tự và đồng thời) → chỉ 1 Conversation")
    void scenarioD_acceptIsIdempotent() throws Exception {
        Account student = createStudent();
        long industry = createIndustry();
        MentorAccount mentor = createMentor(industry);
        long requestId = createGeneralRequest(student, industry);

        MentorIncomingRequestDetailResponse first = accept(mentor, requestId);
        MentorIncomingRequestDetailResponse second = accept(mentor, requestId);
        assertThat(first.getConversationId()).isEqualTo(second.getConversationId());
        assertThat(countConversations(requestId, mentor)).isEqualTo(1);

        MentorAccount mentor2 = createMentor(industry);
        List<MentorIncomingRequestDetailResponse> concurrentResults = runConcurrently(
                () -> accept(mentor2, requestId),
                () -> accept(mentor2, requestId));
        assertThat(concurrentResults.get(0).getConversationId()).isEqualTo(concurrentResults.get(1).getConversationId());
        assertThat(countConversations(requestId, mentor2)).isEqualTo(1);
    }

    @Test
    @DisplayName("E: Deal v1 → Mentor tạo v2 → Student xác nhận v1 bị từ chối, v2 thành công")
    void scenarioE_staleVersionRejected() throws Exception {
        Account student = createStudent();
        long industry = createIndustry();
        MentorAccount mentor = createMentor(industry);
        long requestId = createGeneralRequest(student, industry);
        long convId = accept(mentor, requestId).getConversationId();

        MentoringDealResponse v1 = renegotiate(mentor, convId, new BigDecimal("350000"));
        assertThat(v1.getVersion()).isEqualTo(1);
        MentoringDealResponse v2 = renegotiate(mentor, convId, new BigDecimal("400000"));
        assertThat(v2.getVersion()).isEqualTo(2);

        assertThatThrownBy(() -> dealService.confirmDeal(student.id(), v1.getId(), 1))
                .isInstanceOf(ConflictException.class);

        MentoringDealResponse confirmed = dealService.confirmDeal(student.id(), v2.getId(), 2);
        assertThat(confirmed.getStatus().name()).isEqualTo("DEAL_CONFIRMED");
        assertThat(confirmed.getVersion()).isEqualTo(2);
        assertThat(confirmed.getAgreedPrice()).isEqualByComparingTo("400000");
    }

    @Test
    @DisplayName("F: Student có thể xác nhận đồng thời nhiều Deal; chỉ Mentor được thanh toán thành công mới thắng")
    void scenarioF_concurrentConfirmationMultipleDealsAllowed() throws Exception {
        Account student = createStudent();
        long industry = createIndustry();
        MentorAccount mentorA = createMentor(industry);
        MentorAccount mentorB = createMentor(industry);
        long requestId = createGeneralRequest(student, industry);
        long convA = accept(mentorA, requestId).getConversationId();
        long convB = accept(mentorB, requestId).getConversationId();
        MentoringDealResponse dealA = proposeByRequest(mentorA, convA);
        MentoringDealResponse dealB = proposeByRequest(mentorB, convB);

        // Cả 2 Deal đều được phép xác nhận (không còn bị chặn bởi unique index cũ)
        List<Object> results = runConcurrentlyCollecting(
                () -> dealService.confirmDeal(student.id(), dealA.getId(), 1),
                () -> dealService.confirmDeal(student.id(), dealB.getId(), 1));

        long successes = results.stream().filter(r -> r instanceof MentoringDealResponse).count();
        assertThat(successes).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM mentoring_deals WHERE request_id = ? AND status = 'DEAL_CONFIRMED'", Integer.class, requestId))
                .isEqualTo(2);

        // Request vẫn mở, chưa gán mentor nào
        assertThat(requestRow(requestId, "status")).isEqualTo("OPEN");
        assertThat(requestLong(requestId, "selected_mentor_id")).isNull();

        // Học viên quyết định thanh toán Deal A
        long orderA = pay(student, dealA.getId());
        webhookSuccess(orderA, 500000L);

        // Sau thanh toán: Mentor A chính thức thắng, Deal B bị đóng
        assertThat(requestRow(requestId, "status")).isEqualTo("CLOSED");
        assertThat(requestLong(requestId, "selected_mentor_id")).isEqualTo(mentorA.id());
        assertThat(dealStatus(dealB.getId())).isEqualTo("CANCELLED");
        assertThat(countTasksForDeal(dealA.getId())).isEqualTo(1);
    }

    @Test
    @DisplayName("G: Callback Payment SUCCESS gửi 2 lần → chỉ 1 Task, sổ quỹ chỉ ghi 1 lần (Idempotent)")
    void scenarioG_webhookIdempotent() throws Exception {
        Account student = createStudent();
        long industry = createIndustry();
        MentorAccount mentor = createMentor(industry);
        long requestId = createGeneralRequest(student, industry);
        long convId = accept(mentor, requestId).getConversationId();
        MentoringDealResponse deal = proposeByRequest(mentor, convId);
        dealService.confirmDeal(student.id(), deal.getId(), 1);

        long orderCode = pay(student, deal.getId());
        webhookSuccess(orderCode, 500000L);
        webhookSuccess(orderCode, 500000L); // Gửi lần 2

        assertThat(countTasksForDeal(deal.getId())).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM mentoring_task_payments WHERE order_code = ?", Integer.class, orderCode)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM mentoring_payment_ledgers WHERE request_id = ? AND transaction_type = 'ESCROW_COLLECTION'", Integer.class, requestId)).isEqualTo(1);
    }

    @Test
    @DisplayName("H: Payment FAILED → không tạo Task, Request vẫn OPEN, không khóa cứng vào Mentor để Student có thể chọn lại")
    void scenarioH_paymentFailureKeepsRequestOpen() throws Exception {
        Account student = createStudent();
        long industry = createIndustry();
        MentorAccount mentor = createMentor(industry);
        long requestId = createGeneralRequest(student, industry);
        long convId = accept(mentor, requestId).getConversationId();
        MentoringDealResponse deal = proposeByRequest(mentor, convId);
        dealService.confirmDeal(student.id(), deal.getId(), 1);

        long failedOrder = pay(student, deal.getId());
        webhook(failedOrder, 500000L, "01"); // Cổng báo lỗi thanh toán

        assertThat(jdbc.queryForObject("SELECT payment_status FROM mentoring_task_payments WHERE order_code = ?", String.class, failedOrder)).isEqualTo("FAILED");
        assertThat(countTasksForDeal(deal.getId())).isZero();

        // Thiết kế mới: Request vẫn là OPEN, selected_mentor_id vẫn là null
        assertThat(requestRow(requestId, "status")).isEqualTo("OPEN");
        assertThat(requestLong(requestId, "selected_mentor_id")).isNull();
        assertThat(dealStatus(deal.getId())).isEqualTo("DEAL_CONFIRMED");

        // Thử lại: Học viên có thể tạo đơn thanh toán mới thành công
        long retryOrder = pay(student, deal.getId());
        assertThat(retryOrder).isNotEqualTo(failedOrder);
        webhookSuccess(retryOrder, 500000L);
        assertThat(countTasksForDeal(deal.getId())).isEqualTo(1);
        assertThat(requestRow(requestId, "status")).isEqualTo("CLOSED");
        assertThat(requestLong(requestId, "selected_mentor_id")).isEqualTo(mentor.id());
    }

    @Test
    @DisplayName("I: Mentor A truy cập Conversation / Deal của Mentor B → Forbidden")
    void scenarioI_crossMentorAccessForbidden() throws Exception {
        Account student = createStudent();
        Account stranger = createStudent();
        long industry = createIndustry();
        MentorAccount mentorA = createMentor(industry);
        MentorAccount mentorB = createMentor(industry);
        long requestId = createGeneralRequest(student, industry);

        long convA = accept(mentorA, requestId).getConversationId();
        long convB = accept(mentorB, requestId).getConversationId();
        MentoringDealResponse dealB = proposeByRequest(mentorB, convB);

        assertThatThrownBy(() -> dealService.getDealDetail(mentorA.id(), dealB.getId()))
                .isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> dealService.confirmDeal(mentorA.id(), dealB.getId(), 1))
                .isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> chatContextService.getConversationContext(mentorA.id(), convB))
                .isInstanceOf(ForbiddenException.class);
        assertThatThrownBy(() -> chatContextService.getConversationContext(stranger.id(), convB))
                .isInstanceOf(ForbiddenException.class);

        mockMvc.perform(get("/api/v1/mentoring/conversations/" + convB).with(user(mentorA.email())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/mentoring/conversations/" + convB).with(user(student.email())))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/mentoring/conversations/" + convA).with(user(mentorA.email())))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("J: Frontend gửi amount giả → backend bỏ qua, dùng agreed_price của Deal đã khóa")
    void scenarioJ_clientAmountIgnored() throws Exception {
        Account student = createStudent();
        long industry = createIndustry();
        MentorAccount mentor = createMentor(industry);
        long requestId = createGeneralRequest(student, industry);
        long convId = accept(mentor, requestId).getConversationId();
        MentoringDealResponse deal = renegotiate(mentor, convId, new BigDecimal("720000"));
        dealService.confirmDeal(student.id(), deal.getId(), deal.getVersion());

        mockMvc.perform(post("/api/v1/mentoring/task-payments/checkout")
                        .with(user(student.email()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"dealId\":" + deal.getId() + ",\"amount\":1000,\"agreedPrice\":1000}"))
                .andExpect(status().isCreated());

        ArgumentCaptor<CreatePaymentLinkRequest> captor = ArgumentCaptor.forClass(CreatePaymentLinkRequest.class);
        verify(payOSGateway, atLeastOnce()).createPaymentLink(captor.capture());
        assertThat(captor.getValue().getAmount()).isEqualTo(720000L);
        assertThat(jdbc.queryForObject("SELECT amount FROM mentoring_task_payments WHERE deal_id = ? ORDER BY id DESC LIMIT 1",
                BigDecimal.class, deal.getId())).isEqualByComparingTo("720000");
    }

    // =====================================================================
    // FLOW HELPERS
    // =====================================================================

    private MentorIncomingRequestDetailResponse accept(MentorAccount mentor, long requestId) {
        return requestService.acceptIncomingRequest(mentor.email(), requestId,
                RespondMentoringRequestRequest.builder().responseNote("Mình có thể hỗ trợ bạn.").build());
    }

    private MentoringDealResponse proposeByRequest(MentorAccount mentor, long convId) {
        return dealService.proposeDeal(mentor.id(), ProposeDealRequest.builder()
                .conversationId(convId)
                .proposalSource(ProposalSource.REQUEST_ACCEPTANCE)
                .build());
    }

    private MentoringDealResponse renegotiate(MentorAccount mentor, long convId, BigDecimal price) {
        return dealService.proposeDeal(mentor.id(), ProposeDealRequest.builder()
                .conversationId(convId)
                .proposalSource(ProposalSource.RENEGOTIATION)
                .taskScope("Review CV và luyện phỏng vấn 3 buổi online")
                .agreedPrice(price)
                .deadline(Instant.now().plus(20, ChronoUnit.DAYS))
                .workingMode(MentoringWorkingMode.ONLINE)
                .participationType(MentoringParticipationType.INDIVIDUAL)
                .taskType(MentoringTaskType.MOCK_INTERVIEW)
                .expectedResult("CV hoàn chỉnh và 3 buổi phỏng vấn thử có nhận xét")
                .build());
    }

    private long pay(Account student, long dealId) {
        MentoringTaskPaymentCheckoutResponse checkout = paymentService.createTaskPayment(student.id(),
                CreateTaskPaymentRequest.builder().dealId(dealId).build());
        return checkout.getOrderCode();
    }

    private void webhookSuccess(long orderCode, long amount) throws Exception {
        webhook(orderCode, amount, "00");
    }

    private void webhook(long orderCode, long amount, String code) throws Exception {
        WebhookData data = mock(WebhookData.class);
        when(data.getOrderCode()).thenReturn(orderCode);
        when(data.getAmount()).thenReturn(amount);
        when(data.getCode()).thenReturn(code);
        when(payOSGateway.verifyPaymentWebhookData(any())).thenReturn(data);
        paymentService.handlePayOSWebhook(mock(Webhook.class));
    }

    @SafeVarargs
    private <T> List<T> runConcurrently(Callable<T>... tasks) throws Exception {
        List<Object> results = runConcurrentlyCollecting(tasks);
        List<T> values = new ArrayList<>();
        for (Object r : results) {
            if (r instanceof Throwable t) {
                throw new AssertionError("Tác vụ đồng thời thất bại", t);
            }
            @SuppressWarnings("unchecked") T v = (T) r;
            values.add(v);
        }
        return values;
    }

    /** Chạy đồng thời các tác vụ (cùng xuất phát qua latch), trả về kết quả hoặc ngoại lệ của từng tác vụ */
    @SafeVarargs
    private List<Object> runConcurrentlyCollecting(Callable<?>... tasks) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(tasks.length);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Object>> futures = new ArrayList<>();
            for (Callable<?> task : tasks) {
                futures.add(pool.submit(() -> {
                    start.await();
                    try {
                        return task.call();
                    } catch (Exception ex) {
                        return ex;
                    }
                }));
            }
            start.countDown();
            List<Object> results = Collections.synchronizedList(new ArrayList<>());
            for (Future<Object> f : futures) {
                results.add(f.get());
            }
            return results;
        } finally {
            pool.shutdownNow();
        }
    }

    // =====================================================================
    // FIXTURES (JDBC)
    // =====================================================================

    private String uniq() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private Account createStudent() {
        return createUser("STUDENT", "Sinh Viên " + uniq());
    }

    private Account createUser(String role, String fullName) {
        String email = "e2e-" + uniq() + "@test.alumnect.vn";
        Long roleId = jdbc.queryForObject("SELECT id FROM roles WHERE name = ?", Long.class, role);
        Long id = jdbc.queryForObject("INSERT INTO users (email, password_hash, role_id, account_status, email_verified, is_account_verified, auth_provider) " +
                "VALUES (?, 'x', ?, 'ACTIVE', TRUE, TRUE, 'LOCAL') RETURNING id", Long.class, email, roleId);
        jdbc.update("INSERT INTO user_profiles (user_id, full_name, student_code) VALUES (?, ?, ?)", id, fullName, "E2E" + id);
        jdbc.update("INSERT INTO user_terms_acceptances (user_id, terms_version) VALUES (?, ?)", id, mentoringProperties.getVersion());
        return new Account(id, email);
    }

    private long createIndustry() {
        return jdbc.queryForObject("INSERT INTO industries (name) VALUES (?) RETURNING id", Long.class, "E2E Lĩnh vực " + uniq());
    }

    private MentorAccount createMentor(long industryId) {
        Account account = createUser("ALUMNI", "Mentor " + uniq());
        Long profileId = jdbc.queryForObject("INSERT INTO mentor_profiles (user_id, mentor_status, working_mode, mentoring_type) " +
                "VALUES (?, 'ACTIVE', 'BOTH', 'BOTH') RETURNING id", Long.class, account.id());
        Long packageId = jdbc.queryForObject("INSERT INTO mentor_packages (code, name, duration_months, price) VALUES (?, 'Gói kiểm thử', 1, 10000) RETURNING id",
                Long.class, "E2E-" + uniq());
        jdbc.update("INSERT INTO mentor_subscriptions (mentor_profile_id, package_id, price_at_purchase, duration_months, status, start_date, end_date) " +
                "VALUES (?, ?, 10000, 1, 'ACTIVE', now() - interval '1 day', now() + interval '30 day')", profileId, packageId);
        jdbc.update("INSERT INTO mentor_supported_fields (mentor_profile_id, industry_id) VALUES (?, ?)", profileId, industryId);
        return new MentorAccount(account.id(), account.email(), profileId);
    }

    /** Tạo Request chung qua service UC100 thật (matching nội bộ theo lĩnh vực riêng của test) */
    private long createGeneralRequest(Account student, long industryId) {
        return requestService.createMentoringRequest(student.email(), requestPayload(industryId, null)).getId();
    }

    private CreateMentoringRequestRequest requestPayload(long industryId, Long mentorProfileId) {
        return CreateMentoringRequestRequest.builder()
                .mentorId(mentorProfileId)
                .title("Cần mentor review CV Java Backend")
                .description("Em cần mentor review CV và luyện phỏng vấn vị trí Java Backend Intern.")
                .industryId(industryId)
                .budgetMin(new BigDecimal("300000"))
                .budgetMax(new BigDecimal("500000"))
                .workingMode(MentoringWorkingMode.ONLINE)
                .participationType(MentoringType.INDIVIDUAL)
                .taskType(MentoringTaskType.CAREER_ORIENTATION)
                .expectedDeadline(Instant.now().plus(14, ChronoUnit.DAYS))
                .build();
    }

    private String distributionStatus(long requestId, MentorAccount mentor) {
        return jdbc.queryForObject("SELECT status FROM mentoring_request_distributions WHERE request_id = ? AND mentor_profile_id = ?",
                String.class, requestId, mentor.profileId());
    }

    private String requestRow(long requestId, String column) {
        return jdbc.queryForObject("SELECT " + column + " FROM mentoring_requests WHERE id = ?", String.class, requestId);
    }

    private Long requestLong(long requestId, String column) {
        return jdbc.queryForObject("SELECT " + column + " FROM mentoring_requests WHERE id = ?", Long.class, requestId);
    }

    private String dealStatus(long dealId) {
        return jdbc.queryForObject("SELECT status FROM mentoring_deals WHERE id = ?", String.class, dealId);
    }

    private int countTasksForDeal(long dealId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM mentoring_tasks WHERE deal_id = ?", Integer.class, dealId);
    }

    private int countConversations(long requestId, MentorAccount mentor) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM conversations WHERE mentoring_request_id = ? AND mentoring_mentor_id = ?",
                Integer.class, requestId, mentor.id());
    }

    private int countSystemMessages(long conversationId, String contains) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM messages WHERE conversation_id = ? AND message_type = 'SYSTEM' AND content LIKE ?",
                Integer.class, conversationId, "%" + contains + "%");
    }
}
