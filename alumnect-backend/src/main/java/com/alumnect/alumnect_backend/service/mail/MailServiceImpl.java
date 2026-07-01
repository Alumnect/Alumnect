package com.alumnect.alumnect_backend.service.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Lớp dịch vụ thực thi việc gửi email thực tế qua giao thức SMTP (Gmail) hoặc
 * in ra console làm giả lập nếu cấu hình lỗi.
 * Triển khai interface {@link MailService}.
 */
@Service
@Slf4j
public class MailServiceImpl implements MailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    /**
     * Thực hiện tạo khuôn mẫu HTML và gửi email chứa mã OTP xác thực tài khoản.
     * Nếu không có kết nối SMTP hoặc lỗi xảy ra, thông tin sẽ được in ra console để
     * phát triển cục bộ dễ dàng.
     */
    @Override
    @Async
    public void sendVerificationEmail(String toEmail, String token, String fullName) {
        String subject = "Xác nhận tài khoản AlumNect của bạn";
        String htmlContent = "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px 10px; margin: 0; min-height: 100%;\">"
                + "  <div style=\"max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);\">"
                + "    <!-- Top Banner with FPT/AlumNect color gradient -->"
                + "    <div style=\"background: linear-gradient(135deg, #1e3a8a 0%, #f97316 100%); padding: 30px; text-align: center;\">"
                + "      <h1 style=\"color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;\">AlumNect</h1>"
                + "      <p style=\"color: #e0f2fe; margin: 5px 0 0 0; font-size: 14px;\">Mạng lưới kết nối cựu sinh viên FPT</p>"
                + "    </div>"
                + "    "
                + "    <!-- Body Content -->"
                + "    <div style=\"padding: 40px 30px; color: #334155; line-height: 1.6;\">"
                + "      <h3 style=\"color: #1e3a8a; margin-top: 0; font-size: 20px;\">Xin chào " + fullName + ",</h3>"
                + "      <p style=\"font-size: 16px;\">Cảm ơn bạn đã đăng ký tham gia mạng lưới AlumNect.</p>"
                + "      <p style=\"font-size: 16px;\">Dưới đây là mã xác thực tài khoản (OTP) của bạn. Vui lòng nhập mã này vào trang xác thực để hoàn tất quá trình đăng ký:</p>"
                + "      "
                + "      <!-- OTP Display Box -->"
                + "      <div style=\"text-align: center; margin: 35px 0;\">"
                + "        <div style=\"display: inline-block; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 15px 35px; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #f97316; font-family: 'Courier New', Courier, monospace;\">"
                + token
                + "        </div>"
                + "      </div>"
                + "      "
                + "      <p style=\"font-size: 14px; color: #64748b; margin-top: 30px; border-left: 3px solid #f97316; padding-left: 10px;\">"
                + "        <strong>Lưu ý:</strong> Mã xác thực này có hiệu lực trong vòng <strong>5 phút</strong> và chỉ được sử dụng một lần duy nhất. Vì lý do an toàn, vui lòng không chia sẻ mã này cho bất kỳ ai khác."
                + "      </p>"
                + "    </div>"
                + "    "
                + "    <!-- Footer -->"
                + "    <div style=\"background-color: #f8fafc; padding: 25px 30px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0;\">"
                + "      <p style=\"margin: 0;\">Trân trọng,</p>"
                + "      <p style=\"margin: 5px 0 15px 0; font-weight: bold; color: #475569;\">Đội ngũ vận hành AlumNect</p>"
                + "      <hr style=\"border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;\" />"
                + "      <p style=\"margin: 0; font-size: 11px;\">Đây là email tự động từ hệ thống AlumNect. Vui lòng không trả lời email này.</p>"
                + "    </div>"
                + "  </div>"
                + "</div>";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Gửi email xác thực thành công tới: {}", toEmail);
        } catch (Exception e) {
            log.error("Gửi email xác thực qua SMTP thất bại: {}. HIỂN THỊ TRÊN CONSOLE.", e.getMessage());
            System.out.println("====================================================================");
            System.out.println("ALUMNECT - DỊCH VỤ EMAIL GIẢ LẬP");
            System.out.println("Tới: " + toEmail);
            System.out.println("Tiêu đề: " + subject);
            System.out.println("Mã OTP Xác thực: " + token);
            System.out.println("====================================================================");
        }
    }
}
