package com.alumnect.alumnect_backend.controller.payment;

import com.alumnect.alumnect_backend.service.payment.PayOSWebhookRouter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.payos.model.webhooks.Webhook;

import java.util.Map;

/**
 * URL Webhook duy nhất cần cấu hình trên dashboard PayOS (Kênh thu): /api/v1/payments/payos/webhook.
 */
@RestController
@RequestMapping("/payments/payos")
@RequiredArgsConstructor
@Tag(name = "PayOS Webhook", description = "Webhook PayOS dùng chung cho thanh toán gói Mentor và Mentoring Task")
public class PayOSWebhookController {

    private final PayOSWebhookRouter webhookRouter;

    @PostMapping("/webhook")
    @Operation(summary = "Tiếp nhận Webhook PayOS (dùng chung)")
    public ResponseEntity<Map<String, Object>> handleWebhook(@RequestBody Webhook webhook) {
        webhookRouter.route(webhook);
        return ResponseEntity.ok(Map.of("error", 0, "message", "Webhook processed successfully"));
    }
}
