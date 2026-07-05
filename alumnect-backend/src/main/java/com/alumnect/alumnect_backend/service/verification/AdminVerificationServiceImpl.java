package com.alumnect.alumnect_backend.service.verification;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.common.enums.VerificationStatus;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dao.verification.VerificationRequestRepository;
import com.alumnect.alumnect_backend.dto.request.verification.AdminReviewVerificationDto;
import com.alumnect.alumnect_backend.dto.response.verification.AdminVerificationRequestDto;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.entity.verification.VerificationRequest;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.verification.AdminVerificationMapper;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Lớp triển khai các nghiệp vụ phê duyệt yêu cầu xác minh cựu sinh viên của Admin.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminVerificationServiceImpl implements AdminVerificationService {

    private final VerificationRequestRepository verificationRequestRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AdminVerificationMapper adminVerificationMapper;

    /**
     * Lấy danh sách các phiếu yêu cầu xác minh cựu sinh viên phân trang.
     * Cho phép lọc theo trạng thái duyệt (PENDING, APPROVED, REJECTED).
     *
     * @param status Trạng thái lọc
     * @param page Số thứ tự trang
     * @param size Kích thước trang
     * @return Trang kết quả phiếu xác minh bọc trong PageResponse
     */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminVerificationRequestDto> getVerificationRequests(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<VerificationRequest> spec = (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null && !status.trim().isEmpty()) {
                try {
                    VerificationStatus verificationStatus = VerificationStatus.valueOf(status.trim().toUpperCase());
                    predicates.add(cb.equal(root.get("status"), verificationStatus));
                } catch (IllegalArgumentException e) {
                    // Trạng thái không hợp lệ, bỏ qua
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<VerificationRequest> requestPage = verificationRequestRepository.findAll(spec, pageable);

        List<AdminVerificationRequestDto> content = requestPage.getContent().stream()
                .map(req -> {
                    UserProfile profile = userProfileRepository.findById(req.getUser().getId())
                            .orElse(null);
                    return adminVerificationMapper.toDto(req, profile);
                })
                .toList();

        return PageResponse.<AdminVerificationRequestDto>builder()
                .content(content)
                .pageNumber(requestPage.getNumber())
                .pageSize(requestPage.getSize())
                .totalElements(requestPage.getTotalElements())
                .totalPages(requestPage.getTotalPages())
                .last(requestPage.isLast())
                .build();
    }

    /**
     * Admin xem xét phê duyệt hoặc từ chối phiếu yêu cầu xác minh cựu sinh viên.
     * Nếu APPROVED -> Kích hoạt tài khoản người dùng thành ACTIVE và đặt isAccountVerified = true.
     * Nếu REJECTED -> Đặt trạng thái yêu cầu thành REJECTED và lưu lý do từ chối.
     *
     * @param id Khóa chính của phiếu xác minh
     * @param request DTO chứa quyết định duyệt (APPROVED/REJECTED) và ghi chú
     * @param adminUser Thực thể Admin thực hiện duyệt
     */
    @Override
    public void reviewVerificationRequest(Long id, AdminReviewVerificationDto request, User adminUser) {
        VerificationRequest verificationRequest = verificationRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu yêu cầu xác minh với ID: " + id));

        if (verificationRequest.getStatus() != VerificationStatus.PENDING) {
            throw new BadRequestException("Phiếu yêu cầu xác minh này đã được xử lý từ trước");
        }

        VerificationStatus decision;
        try {
            decision = VerificationStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Quyết định phê duyệt không hợp lệ: " + request.getStatus());
        }

        User user = verificationRequest.getUser();

        verificationRequest.setStatus(decision);
        verificationRequest.setReviewedBy(adminUser);
        verificationRequest.setReviewNote(request.getReviewNote());
        verificationRequest.setReviewedAt(Instant.now());

        if (decision == VerificationStatus.APPROVED) {
            user.setAccountVerified(true);
            user.setAccountStatus(AccountStatus.ACTIVE);
            userRepository.save(user);
        } else if (decision == VerificationStatus.REJECTED) {
            user.setAccountVerified(false);
            user.setAccountStatus(AccountStatus.LOCKED);
            userRepository.save(user);
        }

        verificationRequestRepository.save(verificationRequest);
    }
}
