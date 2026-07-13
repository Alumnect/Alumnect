package com.alumnect.alumnect_backend.service.admin;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.common.enums.AccountStatus;
import com.alumnect.alumnect_backend.dao.user.UserProfileRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.admin.AdminUpdateUserStatusDto;
import com.alumnect.alumnect_backend.dto.response.admin.AdminUserDto;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.admin.AdminMapper;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Lớp triển khai các nghiệp vụ quản lý tài khoản người dùng của Admin.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AdminMapper adminMapper;

    /**
     * Tìm kiếm và lấy danh sách tài khoản người dùng phân trang.
     * Cho phép lọc theo từ khóa (tên/email/mã số sinh viên), vai trò, trạng thái, chuyên ngành, khóa học.
     *
     * @param query Từ khóa tìm kiếm
     * @param role Tên vai trò lọc (STUDENT, ALUMNI, ADMIN)
     * @param status Trạng thái tài khoản lọc (ACTIVE, LOCKED, WAITING_APPROVAL, PENDING)
     * @param majorId ID chuyên ngành lọc
     * @param cohort Khóa học lọc
     * @param page Số thứ tự trang
     * @param size Kích thước trang
     * @return Trang kết quả người dùng bọc trong PageResponse
     */
    @Override
    @Transactional(readOnly = true)
    public PageResponse<AdminUserDto> getUsers(String query, String role, String status, Long majorId, Integer cohort, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Specification<User> spec = (root, criteriaQuery, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Join sang bảng UserProfile
            Join<User, UserProfile> profileJoin = root.join("profile");

            // Lọc theo từ khóa (tìm trong email, full_name, student_code)
            if (query != null && !query.trim().isEmpty()) {
                String searchPattern = "%" + query.trim().toLowerCase() + "%";
                Predicate emailPredicate = cb.like(cb.lower(root.get("email")), searchPattern);
                Predicate namePredicate = cb.like(cb.lower(profileJoin.get("fullName")), searchPattern);
                Predicate studentCodePredicate = cb.like(cb.lower(profileJoin.get("studentCode")), searchPattern);
                predicates.add(cb.or(emailPredicate, namePredicate, studentCodePredicate));
            }

            // Lọc theo vai trò (role name)
            if (role != null && !role.trim().isEmpty()) {
                predicates.add(cb.equal(cb.upper(root.get("role").get("name")), role.trim().toUpperCase()));
            }

            // Lọc theo trạng thái tài khoản
            if (status != null && !status.trim().isEmpty()) {
                try {
                    AccountStatus accountStatus = AccountStatus.valueOf(status.trim().toUpperCase());
                    predicates.add(cb.equal(root.get("accountStatus"), accountStatus));
                } catch (IllegalArgumentException e) {
                    // Trạng thái không hợp lệ, bỏ qua
                }
            }

            // Lọc theo chuyên ngành (major_id)
            if (majorId != null) {
                predicates.add(cb.equal(profileJoin.get("major").get("id"), majorId));
            }

            // Lọc theo khóa học (cohort)
            if (cohort != null) {
                predicates.add(cb.equal(profileJoin.get("cohort"), cohort));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<User> userPage = userRepository.findAll(spec, pageable);

        List<AdminUserDto> content = userPage.getContent().stream()
                .map(user -> adminMapper.toDto(user, user.getProfile()))
                .toList();

        return PageResponse.<AdminUserDto>builder()
                .content(content)
                .pageNumber(userPage.getNumber())
                .pageSize(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
    }

    /**
     * Lấy thông tin chi tiết hồ sơ tài khoản người dùng.
     *
     * @param id Khóa chính người dùng
     * @return DTO thông tin chi tiết
     */
    @Override
    @Transactional(readOnly = true)
    public AdminUserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));
        UserProfile profile = userProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ cho người dùng với ID: " + id));
        return adminMapper.toDto(user, profile);
    }

    /**
     * Cập nhật trạng thái khóa/mở khóa tài khoản người dùng.
     *
     * @param id Khóa chính người dùng cần cập nhật
     * @param request DTO chứa trạng thái mới
     */
    @Override
    public void updateUserStatus(Long id, AdminUpdateUserStatusDto request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + id));

        try {
            AccountStatus newStatus = AccountStatus.valueOf(request.getStatus().toUpperCase());
            user.setAccountStatus(newStatus);
            userRepository.save(user);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Trạng thái tài khoản không hợp lệ: " + request.getStatus());
        }
    }
}
