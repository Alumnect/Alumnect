package com.alumnect.alumnect_backend.security;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Điểm vào xử lý lỗi xác thực (Authentication Entry Point) cho REST API.
 * <p>
 * Khi request không có/kèm JWT không hợp lệ hoặc đã hết hạn truy cập vào endpoint
 * yêu cầu đăng nhập, Spring Security mặc định (không cấu hình entry point) sẽ trả
 * HTTP 403 với body rỗng. Frontend lại chỉ kích hoạt cơ chế tự làm mới token
 * (auto-refresh trong interceptor axios) khi nhận HTTP 401 — vì vậy lớp này bắt
 * buộc phải tồn tại để trả về đúng 401 kèm body JSON chuẩn {@link ApiResponse},
 * nếu không toàn bộ luồng xoay vòng Refresh Token phía Client sẽ không hoạt động.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Ghi response HTTP 401 (Unauthorized) dạng JSON khi xác thực thất bại.
     *
     * @param request       Request gốc bị từ chối xác thực
     * @param response      Response để ghi kết quả trả về
     * @param authException Ngoại lệ xác thực do Spring Security cung cấp
     */
    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        ApiResponse<Void> body = ApiResponse.error(401,
                "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
        objectMapper.writeValue(response.getWriter(), body);
    }
}
