package com.alumnect.alumnect_backend.service.salary;

import com.alumnect.alumnect_backend.common.api.PageResponse;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Lớp dịch vụ thực thi logic nghiệp vụ Salary Board: UC50 (Contribute salary data), UC51 (Edit
 * salary contribution), UC52 (Delete salary contribution), UC53 (View salary statistics), UC54
 * (Filter salary data). Triển khai interface {@link SalaryService}.
 */
@Service
public class SalaryServiceImpl implements SalaryService {

    private static final Logger log = LoggerFactory.getLogger(SalaryServiceImpl.class);

    /**
     * Số mẫu tối thiểu để 1 nhóm (chức danh + cấp bậc + khu vực) được hiển thị trong thống kê
     * (UC53 - View salary statistics). Đặt = 1 để mọi đóng góp hợp lệ đều hiển thị ngay lập tức trên biểu đồ.
     */
    private static final int MIN_SAMPLE_SIZE = 1;

    /** Các giá trị cấp bậc hợp lệ cho bộ lọc "level" (UC54 - Filter salary data). */
    private static final Set<String> VALID_LEVELS = Set.of("Junior", "Mid", "Senior");

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

        String locationCity = sanitizeOptional(request.getLocationCity());
        if (locationCity == null && request.getRegion() != null) {
            locationCity = extractCityFromRegion(request.getRegion());
        }

        SalaryContribution contribution = SalaryContribution.builder()
                .user(user)
                .industry(industry)
                .jobTitle(request.getJobTitle().trim())
                .company(sanitizeOptional(request.getCompany()))
                .region(sanitizeOptional(request.getRegion()))
                .locationCity(locationCity)
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

        String locationCity = sanitizeOptional(request.getLocationCity());
        if (locationCity == null) {
            if (contribution.getLocationCity() != null && !contribution.getLocationCity().isBlank()) {
                locationCity = contribution.getLocationCity();
            } else if (request.getRegion() != null) {
                locationCity = extractCityFromRegion(request.getRegion());
            }
        }

        contribution.setIndustry(industry);
        contribution.setJobTitle(request.getJobTitle().trim());
        contribution.setCompany(sanitizeOptional(request.getCompany()));
        contribution.setRegion(sanitizeOptional(request.getRegion()));
        contribution.setLocationCity(locationCity);
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
     * Luồng: nếu có industryId thì kiểm tra tồn tại (400 nếu không) → nếu có level thì validate thuộc
     * {Junior, Mid, Senior} (400 nếu không) → chuẩn hóa region/jobTitle thành mẫu LIKE (tái dùng cách
     * escape của UC44) → đếm tổng số lượt khớp bộ lọc (mọi loại tiền tệ) → lấy trung vị khớp bộ lọc
     * trên dữ liệu VND → lấy danh sách nhóm thống kê khớp bộ lọc, đạt đủ mẫu tối thiểu (chỉ VND) →
     * map từng {@code Object[]} sang {@link SalaryStatRowResponse}.
     */
    @Override
    public SalaryStatisticsResponse getStatistics(Long industryId, String region, String jobTitle, String level) {
        if (industryId != null && !industryRepository.existsById(industryId)) {
            throw new BadRequestException("Ngành nghề không tồn tại");
        }

        String trimmedLevel = level != null ? level.trim() : null;
        if (trimmedLevel != null && !trimmedLevel.isEmpty() && !VALID_LEVELS.contains(trimmedLevel)) {
            throw new BadRequestException("Cấp bậc không hợp lệ (chỉ chấp nhận Junior/Mid/Senior)");
        }

        boolean filterByIndustry = industryId != null;
        boolean filterByRegion = region != null && !region.trim().isEmpty();
        boolean filterByJobTitle = jobTitle != null && !jobTitle.trim().isEmpty();
        boolean filterByLevel = trimmedLevel != null && !trimmedLevel.isEmpty();
        String regionPattern = filterByRegion ? buildLikePattern(region.trim()) : null;
        String jobTitlePattern = filterByJobTitle ? buildLikePattern(jobTitle.trim()) : null;

        long totalContributions = salaryContributionRepository.countFiltered(
                filterByIndustry, industryId, filterByRegion, regionPattern, filterByJobTitle, jobTitlePattern, filterByLevel, trimmedLevel);
        BigDecimal overallMedian = salaryContributionRepository.findOverallMedianVnd(
                filterByIndustry, industryId, filterByRegion, regionPattern, filterByJobTitle, jobTitlePattern, filterByLevel, trimmedLevel);

        List<Object[]> rawRows = salaryContributionRepository.findGroupedStatistics(
                filterByIndustry, industryId, filterByRegion, regionPattern, filterByJobTitle, jobTitlePattern, filterByLevel, trimmedLevel, MIN_SAMPLE_SIZE);
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

    /**
     * {@inheritDoc}
     * <p>
     * Luồng: validate page/size (400 nếu sai — tránh {@code PageRequest.of} ném lỗi rồi bị trả về
     * nhầm HTTP 500, cùng cách làm {@code QuestionServiceImpl.getQuestions}) → truy vấn TOÀN BỘ bảng
     * (không lọc theo user) → map từng bản ghi qua {@link SalaryMapper} (không lộ danh tính) → đóng
     * gói {@link PageResponse}.
     */
    @Override
    public PageResponse<SalaryContributionResponse> getFeed(int page, int size) {
        if (page < 0) {
            throw new BadRequestException("Tham số page phải là số nguyên không âm");
        }
        if (size <= 0) {
            throw new BadRequestException("Tham số size phải là số nguyên dương");
        }

        // Method name (findAllByOrderByCreatedAtDesc) đã tự quy định thứ tự sắp xếp — Pageable ở đây
        // chỉ dùng cho phân trang, không cần truyền thêm Sort để tránh xung đột không cần thiết.
        Page<SalaryContribution> contributionsPage = salaryContributionRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));

        List<SalaryContributionResponse> content = contributionsPage.getContent().stream()
                .map(salaryMapper::toResponse)
                .collect(Collectors.toList());

        return PageResponse.<SalaryContributionResponse>builder()
                .content(content)
                .pageNumber(contributionsPage.getNumber())
                .pageSize(contributionsPage.getSize())
                .totalElements(contributionsPage.getTotalElements())
                .totalPages(contributionsPage.getTotalPages())
                .last(contributionsPage.isLast())
                .build();
    }

    /**
     * Chuẩn hóa từ khóa lọc (UC54 - Filter salary data: khu vực/chức danh) thành mẫu ILIKE:
     * bọc {@code %...%} để khớp substring không phân biệt hoa/thường.
     *
     * @param rawKeyword Từ khóa đã trim, không rỗng
     * @return Mẫu ILIKE sẵn sàng truyền cho các query native
     */
    private String buildLikePattern(String rawKeyword) {
        String escaped = rawKeyword.trim()
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
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

    /**
     * Tự động trích xuất tên Tỉnh/Thành phố chuẩn từ chuỗi địa chỉ chi tiết (đề phòng trường hợp
     * Frontend không gửi kèm hoặc bị mất locationCity khi sửa dữ liệu).
     */
    private String extractCityFromRegion(String region) {
        if (region == null || region.isBlank()) {
            return null;
        }
        String lower = region.toLowerCase();
        if (lower.contains("hồ chí minh") || lower.contains("hcm") || lower.contains("sài gòn") || lower.contains("saigon")) {
            return "Thành Phố Hồ Chí Minh";
        }
        if (lower.contains("hà nội") || lower.contains("ha noi")) {
            return "Hà Nội";
        }
        if (lower.contains("đà nẵng") || lower.contains("da nang")) {
            return "Đà Nẵng";
        }
        if (lower.contains("cần thơ") || lower.contains("can tho")) {
            return "Cần Thơ";
        }
        if (lower.contains("hải phòng") || lower.contains("hai phong")) {
            return "Hải Phòng";
        }
        if (lower.contains("bình dương") || lower.contains("binh duong")) {
            return "Bình Dương";
        }
        if (lower.contains("bình định") || lower.contains("quy nhơn") || lower.contains("binh dinh") || lower.contains("quy nhon")) {
            return "Bình Định";
        }
        if (lower.contains("huế") || lower.contains("thừa thiên")) {
            return "Thừa Thiên Huế";
        }
        if (lower.contains("đồng nai") || lower.contains("dong nai")) {
            return "Đồng Nai";
        }
        String[] parts = region.split(",");
        if (parts.length > 0) {
            String last = parts[parts.length - 1].trim();
            String cleaned = last.replaceAll("(?i)^(thành phố|tỉnh|tp\\.?)\\s+", "").trim();
            return cleaned.isEmpty() ? last : cleaned;
        }
        return region.trim();
    }
}
