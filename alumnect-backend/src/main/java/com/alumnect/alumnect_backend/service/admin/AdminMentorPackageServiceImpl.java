package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.dao.mentorship.MentorPackageRepository;
import com.alumnect.alumnect_backend.dto.request.admin.AdminUpdateMentorPackageRequest;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorPackageResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentorPackage;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.mentorship.MentorPackageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Class thực thi dịch vụ quản lý các gói dịch vụ Mentor dành cho Admin (UC95).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminMentorPackageServiceImpl implements AdminMentorPackageService {

    private final MentorPackageRepository mentorPackageRepository;
    private final MentorPackageMapper mentorPackageMapper;

    /**
     * Lấy danh sách toàn bộ các gói dịch vụ Mentor (ACTIVE & INACTIVE), sắp xếp theo thời hạn gói.
     *
     * @return Danh sách DTO gói Mentor
     */
    @Override
    @Transactional(readOnly = true)
    public List<MentorPackageResponse> getAllPackages() {
        log.info("Admin truy vấn danh sách toàn bộ các gói dịch vụ Mentor");
        List<MentorPackage> packages = mentorPackageRepository.findAllByOrderByDurationMonthsAsc();
        return mentorPackageMapper.toResponseList(packages);
    }

    /**
     * Cập nhật giá niêm yết và trạng thái hoạt động của gói Mentor.
     *
     * @param id ID gói Mentor
     * @param request DTO giá và trạng thái mới
     * @return DTO gói Mentor sau cập nhật
     */
    @Override
    @Transactional
    public MentorPackageResponse updatePackage(Long id, AdminUpdateMentorPackageRequest request) {
        log.info("Admin cập nhật gói Mentor ID {}: price={}, status={}", id, request.getPrice(), request.getStatus());

        MentorPackage mentorPackage = mentorPackageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gói Mentor với ID: " + id));

        mentorPackage.setPrice(request.getPrice());
        mentorPackage.setStatus(request.getStatus());

        if (request.getName() != null && !request.getName().isBlank()) {
            mentorPackage.setName(request.getName());
        }
        if (request.getDescription() != null) {
            mentorPackage.setDescription(request.getDescription());
        }

        MentorPackage updatedPackage = mentorPackageRepository.save(mentorPackage);
        log.info("Cập nhật thành công gói Mentor ID {}", id);

        return mentorPackageMapper.toResponse(updatedPackage);
    }
}
