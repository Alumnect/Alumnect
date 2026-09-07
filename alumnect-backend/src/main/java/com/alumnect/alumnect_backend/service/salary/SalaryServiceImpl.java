package com.alumnect.alumnect_backend.service.salary;

import com.alumnect.alumnect_backend.dao.salary.IndustryRepository;
import com.alumnect.alumnect_backend.dao.salary.SalaryContributionRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.salary.CreateSalaryContributionRequest;
import com.alumnect.alumnect_backend.dto.request.salary.UpdateSalaryContributionRequest;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryContributionResponse;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryStatRowResponse;
import com.alumnect.alumnect_backend.dto.response.salary.SalaryStatisticsResponse;
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

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Lớp dịch vụ thực thi logic nghiệp vụ Salary Board: UC50 (Contribute salary data), UC51 (Edit
 * salary contribution), UC52 (Delete salary contribution), UC53 (View salary statistics). Triển
 * khai interface {@link SalaryService}.
 */
@Service
public class SalaryServiceImpl implements SalaryService {

    private static final Logger log = LoggerFactory.getLogger(SalaryServiceImpl.class);

    /**
     * Số mẫu tối thiểu để 1 nhóm (chức danh + cấp bậc + khu vực) được hiển thị trong thống kê
     * (UC53 - View salary statistics) — bảo vệ ẩn danh, tránh nhóm quá nhỏ lộ dữ liệu của 1-2 cá nhân.
     */
    private static final int MIN_SAMPLE_SIZE = 5;

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

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: tìm user theo email (404 nếu không có) → lấy toàn bộ đóng góp của chính user đó
     * (mới nhất trước) → map từng bản ghi sang DTO.
     */
    @Override
    public List<SalaryContributionResponse> getMyContributions(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        return salaryContributionRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                .map(salaryMapper::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: tìm user theo email (404) → tìm lượt đóng góp theo id (404) → kiểm tra chính chủ
     * (403 nếu khác) → nếu có industryId thì kiểm tra tồn tại (400 nếu không) → chuẩn hóa currency
     * (400 nếu sai định dạng) → cập nhật các trường → lưu (JPA dirty-checking, `@PreUpdate` tự set
     * lại `updatedAt`) → map trả về.
     */
    @Override
    @Transactional
    public SalaryContributionResponse updateContribution(String email, Long contributionId, UpdateSalaryContributionRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        SalaryContribution contribution = salaryContributionRepository.findById(contributionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt đóng góp với id: " + contributionId));

        // Ownership (UC51): chỉ chính chủ mới được sửa lượt đóng góp của mình; người khác nhận 403.
        if (!contribution.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Chỉ chính chủ mới được chỉnh sửa lượt đóng góp này");
        }

        // Ngành nghề tùy chọn: nếu có industryId thì phải tồn tại, ngược lại để null (bỏ chọn ngành).
        Industry industry = null;
        if (request.getIndustryId() != null) {
            industry = industryRepository.findById(request.getIndustryId())
                    .orElseThrow(() -> new BadRequestException("Ngành nghề không tồn tại"));
        }

        String currency = normalizeCurrency(request.getCurrency());

        contribution.setIndustry(industry);
        contribution.setJobTitle(request.getJobTitle().trim());
        contribution.setCompany(sanitizeOptional(request.getCompany()));
        contribution.setRegion(sanitizeOptional(request.getRegion()));
        contribution.setYearsExperience(request.getYearsExperience());
        contribution.setGrossAmount(request.getGrossAmount());
        contribution.setCurrency(currency);

        SalaryContribution saved;
        try {
            saved = salaryContributionRepository.save(contribution);
        } catch (Exception ex) {
            log.error("Lỗi khi cập nhật đóng góp lương id={} của user {}: ", contributionId, email, ex);
            throw new RuntimeException("Lỗi hệ thống: Không thể cập nhật dữ liệu lương");
        }

        log.info("Chỉnh sửa dữ liệu lương: id={}, industryId={}, tác giả={} (ẩn danh khi hiển thị)",
                saved.getId(), request.getIndustryId(), email);

        return salaryMapper.toResponse(saved);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: tìm user theo email (404) → tìm lượt đóng góp theo id (404) → kiểm tra chính chủ
     * (403 nếu khác) → xóa cứng. Không cần dọn dữ liệu liên quan nào khác — không bảng nào tham
     * chiếu tới {@code salary_contributions} (khác Answer cần dọn `votes` trước khi xóa ở UC49).
     */
    @Override
    @Transactional
    public void deleteContribution(String email, Long contributionId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng"));

        SalaryContribution contribution = salaryContributionRepository.findById(contributionId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt đóng góp với id: " + contributionId));

        // Ownership (UC52): chỉ chính chủ mới được xóa lượt đóng góp của mình; người khác nhận 403.
        if (!contribution.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException("Chỉ chính chủ mới được xóa lượt đóng góp này");
        }

        salaryContributionRepository.delete(contribution);

        log.info("Xóa dữ liệu lương: id={}, tác giả={} (ẩn danh khi hiển thị)", contributionId, email);
    }

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: đếm tổng số lượt đóng góp (mọi loại tiền tệ) → lấy trung vị chung trên dữ liệu VND →
     * lấy danh sách nhóm thống kê đạt đủ mẫu tối thiểu (chỉ VND) → map từng {@code Object[]} sang
     * {@link SalaryStatRowResponse}.
     */
    @Override
    public SalaryStatisticsResponse getStatistics() {
        long totalContributions = salaryContributionRepository.count();
        BigDecimal overallMedian = salaryContributionRepository.findOverallMedianVnd();

        List<Object[]> rawRows = salaryContributionRepository.findGroupedStatistics(MIN_SAMPLE_SIZE);
        List<SalaryStatRowResponse> rows = new ArrayList<>();
        for (Object[] r : rawRows) {
            rows.add(SalaryStatRowResponse.builder()
                    .role((String) r[0])
                    .level((String) r[1])
                    .region((String) r[2])
                    .samples(((Number) r[3]).longValue())
                    .p25((BigDecimal) r[4])
                    .median((BigDecimal) r[5])
                    .p75((BigDecimal) r[6])
                    .build());
        }

        return SalaryStatisticsResponse.builder()
                .totalContributions(totalContributions)
                .trackedPositions(rows.size())
                .overallMedian(overallMedian)
                .rows(rows)
                .build();
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
