package com.alumnect.alumnect_backend.service.alumnemap;

import com.alumnect.alumnect_backend.dto.response.alumnemap.AlumniMapResponse;
import java.util.List;

/**
 * Giao diện cung cấp dịch vụ lấy dữ liệu bản đồ cựu sinh viên.
 * Định nghĩa phương thức lấy danh sách các vị trí cựu sinh viên để plot lên bản đồ.
 */
public interface AlumniMapService {

    /**
     * Lấy danh sách vị trí địa lý và thông tin hiển thị rút gọn của các cựu sinh viên hoạt động.
     * Chỉ trả về các hồ sơ hợp lệ và không chứa thông tin riêng tư nhạy cảm.
     *
     * @return Danh sách các DTO AlumniMapResponse
     */
    List<AlumniMapResponse> getAlumniMapLocations();
}
