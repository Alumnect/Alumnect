package com.alumnect.alumnect_backend.service.alumnimap;

import com.alumnect.alumnect_backend.dao.alumnimap.AlumniMapRepository;
import com.alumnect.alumnect_backend.dao.alumnimap.AlumniMapProjection;
import com.alumnect.alumnect_backend.dto.response.alumnimap.AlumniMapResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlumniMapServiceImpl implements AlumniMapService {

    private final AlumniMapRepository alumniMapRepository;

    @Override
    @Transactional(readOnly = true)
    public List<AlumniMapResponse> getAlumniMapLocations(
            String search,
            String title,
            String company,
            String location,
            Integer cohort,
            Long majorId
    ) {
        log.info("Bắt đầu lấy danh sách cựu sinh viên hoạt động để vẽ bản đồ với bộ lọc");
        
        String searchPattern = (search != null && !search.trim().isEmpty()) ? "%" + search.trim().toLowerCase() + "%" : null;
        String titlePattern = (title != null && !title.trim().isEmpty()) ? "%" + title.trim().toLowerCase() + "%" : null;
        String companyPattern = (company != null && !company.trim().isEmpty()) ? "%" + company.trim().toLowerCase() + "%" : null;
        String locationPattern = (location != null && !location.trim().isEmpty()) ? "%" + location.trim().toLowerCase() + "%" : null;

        List<AlumniMapProjection> projections = alumniMapRepository.findAlumniMapLocations(
            searchPattern, titlePattern, companyPattern, locationPattern, cohort, majorId
        );
        
        log.info("Truy xuất thành công {} cựu sinh viên có thông tin vị trí địa lý hợp lệ", projections.size());
        
        return projections.stream()
                .map(p -> AlumniMapResponse.builder()
                        .userId(p.getUserId())
                        .majorId(p.getMajorId())
                        .fullName(p.getFullName())
                        .avatarUrl(p.getAvatarUrl())
                        .verifiedStatus(p.getVerified())
                        .title(p.getTitle())
                        .company(p.getCompany())
                        .location(p.getLocation())
                        .locationCity(p.getLocationCity())
                        .locationCountry(p.getLocationCountry())
                        .locationCountryCode(p.getLocationCountryCode())
                        .latitude(p.getLatitude())
                        .longitude(p.getLongitude())
                        .startDate(p.getStartDate())
                        .profileIdentifier(String.valueOf(p.getUserId()))
                        .cohort(p.getCohort())
                        .build())
                .collect(Collectors.toList());
    }
}
