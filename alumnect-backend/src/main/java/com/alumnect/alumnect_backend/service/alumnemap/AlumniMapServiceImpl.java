package com.alumnect.alumnect_backend.service.alumnemap;

import com.alumnect.alumnect_backend.dao.alumnemap.AlumniMapRepository;
import com.alumnect.alumnect_backend.dto.response.alumnemap.AlumniMapResponse;
import com.alumnect.alumnect_backend.entity.user.UserProfile;
import com.alumnect.alumnect_backend.mapper.alumnemap.AlumniMapMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Lớp triển khai của giao diện AlumniMapService.
 * Thực hiện truy vấn danh sách hồ sơ cựu sinh viên từ cơ sở dữ liệu và ánh xạ sang định dạng DTO rút gọn.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AlumniMapServiceImpl implements AlumniMapService {

    private final AlumniMapRepository alumniMapRepository;
    private final AlumniMapMapper alumniMapMapper;

    /**
     * Lấy danh sách tọa độ và thông tin hiển thị tóm tắt của các cựu sinh viên.
     * Dữ liệu được lấy từ AlumniMapRepository với các điều kiện tài khoản ACTIVE và vai trò ALUMNI.
     *
     * @return Danh sách các DTO chứa thông tin phục vụ vẽ marker và popup trên bản đồ
     */
    @Override
    @Transactional(readOnly = true)
    public List<AlumniMapResponse> getAlumniMapLocations() {
        log.info("Bắt đầu lấy danh sách cựu sinh viên hoạt động để vẽ bản đồ");
        
        List<UserProfile> profiles = alumniMapRepository.findAllActiveAlumniWithCoordinates();
        
        log.info("Truy xuất thành công {} cựu sinh viên có thông tin vị trí địa lý hợp lệ", profiles.size());
        
        return profiles.stream()
                .map(alumniMapMapper::toResponse)
                .collect(Collectors.toList());
    }
}
