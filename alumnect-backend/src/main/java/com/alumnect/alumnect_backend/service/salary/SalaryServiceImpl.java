package com.alumnect.alumnect_backend.service.salary;

import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.salary.SalaryContributionRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.salary.CreateSalaryContributionRequest;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryContributionResponse;
import com.alumnect.alumnect_backend.entity.salary.Industry;
import com.alumnect.alumnect_backend.entity.salary.SalaryContribution;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ForbiddenException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.salary.SalaryMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Lớp dịch vụ thực thi logic nghiệp vụ Salary Board (UC50 - Contribute salary data).
 * Triển khai interface {@link SalaryService}.
 */
@Service
public class SalaryServiceImpl implements SalaryService {

    private static final Logger log = LoggerFactory.getLogger(SalaryServiceImpl.class);

    @Autowired
    private SalaryContributionRepository salaryContributionRepository;

    @Autowired
    private IndustryRepository industryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SalaryMapper salaryMapper;

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: tìm user theo email (404 nếu không có) → kiểm tra vai trò ALUMNI (403 nếu khác — Student/Admin
     * không được đóng góp) → nếu có industryId thì kiểm tra tồn tại (400 nếu không) → chuẩn hóa currency
     * (bỏ trống → "VND", có giá trị thì validate 3 chữ cái viết hoa) → tạo SalaryContribution → lưu → map trả về.
     */
    @Override
    @Transactional
    public SalaryContributionResponse createContribution(String email, CreateSalaryContributionRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        // RBAC (UC50): CHỈ Cựu sinh viên (ALUMNI) mới được đóng góp dữ liệu lương — khác các UC Q&A
        // khác (Student + Alumni) vì dữ liệu lương thực tế chỉ có ý nghĩa từ người đã đi làm.
        String roleName = user.getRole() != null ? user.getRole().getName().toUpperCase() : "";
        if (!roleName.equals("ALUMNI")) {
            throw new ForbiddenException("Chỉ cựu sinh viên mới được đóng góp dữ liệu lương");
        }

        // Ngành nghề tùy chọn: nếu có industryId thì phải tồn tại, ngược lại để null (chưa chọn ngành).
        Industry industry = null;
        if (request.getIndustryId() != null) {
            industry = industryRepository.findById(request.getIndustryId())
                    .orElseThrow(() -> new BadRequestException("Ngành nghề không tồn tại"));
        }

        String currency = normalizeCurrency(request.getCurrency());

        SalaryContribution contribution = SalaryContribution.builder()
                .user(user)
                .industry(industry)
                .jobTitle(request.getJobTitle().trim())
                .company(sanitizeOptional(request.getCompany()))
                .region(sanitizeOptional(request.getRegion()))
                .yearsExperience(request.getYearsExperience())
                .grossAmount(request.getGrossAmount())
                .currency(currency)
                .build();

        SalaryContribution saved;
        try {
            saved = salaryContributionRepository.save(contribution);
        } catch (Exception ex) {
            log.error("Lỗi khi lưu đóng góp lương của user {}: ", email, ex);
            throw new RuntimeException("Lỗi hệ thống: Không thể lưu dữ liệu lương");
        }

        log.info("Đóng góp dữ liệu lương: id={}, industryId={}, tác giả={} (ẩn danh khi hiển thị)",
                saved.getId(), request.getIndustryId(), email);

        return salaryMapper.toResponse(saved);
    }

    /** Cắt khoảng trắng thừa; chuỗi rỗng/blank chuẩn hóa thành null (tùy chọn, không lưu chuỗi rỗng). */
    private String sanitizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * Chuẩn hóa đơn vị tiền tệ: bỏ trống → "VND" (mặc định); có giá trị thì phải đúng định dạng
     * 3 chữ cái viết hoa (mã ISO 4217, VD "USD"), sai định dạng → 400.
     *
     * @param rawCurrency Giá trị currency thô từ request (có thể null/rỗng)
     * @return Mã tiền tệ đã chuẩn hóa, luôn có giá trị
     * @throws BadRequestException nếu có giá trị nhưng sai định dạng
     */
    private String normalizeCurrency(String rawCurrency) {
        if (rawCurrency == null || rawCurrency.isBlank()) {
            return "VND";
        }
        String trimmed = rawCurrency.trim().toUpperCase();
        if (!trimmed.matches("[A-Z]{3}")) {
            throw new BadRequestException("Đơn vị tiền tệ phải là mã 3 chữ cái (VD: VND, USD)");
        }
        return trimmed;
    }
}
