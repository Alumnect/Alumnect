package com.alumnect.alumnect_backend.service.user;

import com.alumnect.alumnect_backend.dao.user.ExperienceRepository;
import com.alumnect.alumnect_backend.dao.user.UserRepository;
import com.alumnect.alumnect_backend.dto.request.user.ExperienceRequest;
import com.alumnect.alumnect_backend.dto.request.user.PromotionRequest;
import com.alumnect.alumnect_backend.dto.response.user.ExperienceResponse;
import com.alumnect.alumnect_backend.entity.user.Experience;
import com.alumnect.alumnect_backend.entity.user.User;
import com.alumnect.alumnect_backend.exception.BadRequestException;
import com.alumnect.alumnect_backend.exception.ResourceNotFoundException;
import com.alumnect.alumnect_backend.mapper.user.ExperienceMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExperienceServiceImpl implements ExperienceService {

    private final UserRepository userRepository;
    private final ExperienceRepository experienceRepository;
    private final ExperienceMapper experienceMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ExperienceResponse> getOwnExperiences(String email) {
        User user = getUserByEmail(email);
        return experienceRepository.findByUserIdOrderByStartDateDesc(user.getId())
                .stream()
                .map(experienceMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExperienceResponse createExperience(String email, ExperienceRequest request) {
        User user = getUserByEmail(email);
        validateRequest(request);

        Experience experience = experienceMapper.toEntity(request);
        experience.setUser(user);

        if (experience.isCurrent()) {
            experience.setEndDate(null);
            // Auto-primary if no primary experience exists yet
            Optional<Experience> currentPrimary = experienceRepository.findByUserIdAndIsPrimaryTrue(user.getId());
            if (currentPrimary.isEmpty()) {
                experience.setPrimary(true);
            }
        } else {
            experience.setPrimary(false);
            if (experience.getEndDate() == null) {
                throw new BadRequestException("Ngày kết thúc là bắt buộc đối với kinh nghiệm trong quá khứ");
            }
        }

        if (experience.isPrimary()) {
            resetPrimaryFlagForUser(user.getId());
        }

        Experience saved = experienceRepository.save(experience);
        autoPromoteLatestCurrentExperience(user.getId());

        return experienceMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ExperienceResponse updateExperience(String email, Long id, ExperienceRequest request) {
        User user = getUserByEmail(email);
        validateRequest(request);

        Experience experience = experienceRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kinh nghiệm làm việc với ID: " + id));

        boolean wasPrimary = experience.isPrimary();

        experienceMapper.updateEntityFromRequest(request, experience);

        if (experience.isCurrent()) {
            experience.setEndDate(null);
        } else {
            experience.setPrimary(false);
            if (experience.getEndDate() == null) {
                throw new BadRequestException("Ngày kết thúc là bắt buộc đối với kinh nghiệm trong quá khứ");
            }
        }

        if (experience.isPrimary() && !experience.isCurrent()) {
            throw new BadRequestException("Kinh nghiệm làm việc chính phải là kinh nghiệm hiện tại");
        }

        if (experience.isPrimary() && !wasPrimary) {
            resetPrimaryFlagForUser(user.getId());
            experience.setPrimary(true); // Re-set primary because resetPrimaryFlagForUser cleared it
        }

        Experience saved = experienceRepository.save(experience);

        if (!saved.isPrimary() && wasPrimary) {
            autoPromoteLatestCurrentExperience(user.getId());
        } else {
            autoPromoteLatestCurrentExperience(user.getId());
        }

        return experienceMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteExperience(String email, Long id) {
        User user = getUserByEmail(email);
        Experience experience = experienceRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kinh nghiệm làm việc với ID: " + id));

        boolean wasPrimary = experience.isPrimary();
        experienceRepository.delete(experience);

        if (wasPrimary) {
            autoPromoteLatestCurrentExperience(user.getId());
        }
    }

    @Override
    @Transactional
    public ExperienceResponse promoteExperience(String email, Long id, PromotionRequest request) {
        User user = getUserByEmail(email);
        Experience oldExp = experienceRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kinh nghiệm làm việc cũ với ID: " + id));

        if (!oldExp.isCurrent()) {
            throw new BadRequestException("Không thể thăng chức cho kinh nghiệm làm việc đã kết thúc");
        }
        if (request.getNewStartDate().isBefore(oldExp.getStartDate()) || request.getNewStartDate().equals(oldExp.getStartDate())) {
            throw new BadRequestException("Ngày bắt đầu vai trò mới phải sau ngày bắt đầu vai trò cũ");
        }

        boolean wasPrimary = oldExp.isPrimary();

        // End old experience
        oldExp.setCurrent(false);
        oldExp.setPrimary(false);
        oldExp.setEndDate(request.getNewStartDate().minusDays(1));
        experienceRepository.save(oldExp);

        // Create new experience
        Experience newExp = new Experience();
        newExp.setUser(user);
        newExp.setTitle(request.getNewTitle());
        newExp.setCompany(oldExp.getCompany());
        newExp.setStartDate(request.getNewStartDate());
        newExp.setCurrent(true);
        newExp.setDescription(request.getDescription());

        if (request.isReuseLocation()) {
            newExp.setLocation(oldExp.getLocation());
            newExp.setLatitude(oldExp.getLatitude());
            newExp.setLongitude(oldExp.getLongitude());
            newExp.setPlaceId(oldExp.getPlaceId());
            newExp.setLocationCity(oldExp.getLocationCity());
            newExp.setLocationCountry(oldExp.getLocationCountry());
            newExp.setLocationCountryCode(oldExp.getLocationCountryCode());
            newExp.setGeocodingProvider(oldExp.getGeocodingProvider());
        }

        if (wasPrimary) {
            newExp.setPrimary(true);
        } else {
            newExp.setPrimary(false);
        }

        Experience saved = experienceRepository.save(newExp);
        autoPromoteLatestCurrentExperience(user.getId());

        return experienceMapper.toResponse(saved);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản người dùng với email: " + email));
    }

    private void resetPrimaryFlagForUser(Long userId) {
        Optional<Experience> oldPrimary = experienceRepository.findByUserIdAndIsPrimaryTrue(userId);
        if (oldPrimary.isPresent()) {
            Experience op = oldPrimary.get();
            op.setPrimary(false);
            experienceRepository.save(op);
        }
    }

    private void autoPromoteLatestCurrentExperience(Long userId) {
        Optional<Experience> primary = experienceRepository.findByUserIdAndIsPrimaryTrue(userId);
        if (primary.isPresent()) {
            return; // Already has a primary experience
        }
        List<Experience> currentExps = experienceRepository.findByUserIdAndIsCurrentTrue(userId);
        if (!currentExps.isEmpty()) {
            Experience latest = currentExps.stream()
                    .max((e1, e2) -> {
                        int comp = e1.getStartDate().compareTo(e2.getStartDate());
                        if (comp != 0) return comp;
                        return e1.getId().compareTo(e2.getId());
                    }).orElse(null);
            if (latest != null) {
                latest.setPrimary(true);
                experienceRepository.save(latest);
            }
        }
    }

    private void validateRequest(ExperienceRequest request) {
        if (request.getStartDate() == null) {
            throw new BadRequestException("Ngày bắt đầu không được để trống");
        }
        if (!request.isCurrent() && request.getEndDate() == null) {
            throw new BadRequestException("Ngày kết thúc không được để trống khi đã kết thúc công việc");
        }
        if (request.getEndDate() != null && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("Ngày kết thúc không được trước ngày bắt đầu");
        }
        if (request.isPrimary() && !request.isCurrent()) {
            throw new BadRequestException("Chỉ kinh nghiệm hiện tại mới được đặt làm chính (primary)");
        }
        
        BigDecimal lat = request.getLatitude();
        BigDecimal lng = request.getLongitude();
        if ((lat == null && lng != null) || (lat != null && lng == null)) {
            throw new BadRequestException("Vĩ độ và kinh độ phải cùng tồn tại hoặc cùng trống");
        }
        if (lat != null) {
            if (lat.compareTo(BigDecimal.valueOf(-90)) < 0 || lat.compareTo(BigDecimal.valueOf(90)) > 0) {
                throw new BadRequestException("Vĩ độ phải nằm trong khoảng -90 đến 90");
            }
        }
        if (lng != null) {
            if (lng.compareTo(BigDecimal.valueOf(-180)) < 0 || lng.compareTo(BigDecimal.valueOf(180)) > 0) {
                throw new BadRequestException("Kinh độ phải nằm trong khoảng -180 đến 180");
            }
        }
    }
}
