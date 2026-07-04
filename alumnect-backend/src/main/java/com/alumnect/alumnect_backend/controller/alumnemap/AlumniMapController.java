package com.alumnect.alumnect_backend.controller.alumnemap;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.response.alumnemap.AlumniMapResponse;
import com.alumnect.alumnect_backend.service.alumnemap.AlumniMapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller tiếp nhận và xử lý các yêu cầu HTTP liên quan đến bản đồ cựu sinh viên.
 * Được ánh xạ tự động với tiền tố API chung /api/v1/alumni-map.
 */
@RestController
@RequestMapping("/alumni-map")
@RequiredArgsConstructor
@Slf4j
public class AlumniMapController {

    private final AlumniMapService alumniMapService;

    /**
     * API truy xuất danh sách vị trí tọa độ địa lý và thông tin tóm tắt hiển thị trên bản đồ của các cựu sinh viên.
     * Yêu cầu người dùng phải đăng nhập hệ thống (sử dụng Token Bearer hợp lệ).
     *
     * @return Đối tượng ResponseEntity chứa ApiResponse và danh sách AlumniMapResponse
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AlumniMapResponse>>> getAlumniMapLocations() {
        log.info("Nhận yêu cầu HTTP GET lấy danh sách vị trí cựu sinh viên");
        List<AlumniMapResponse> locations = alumniMapService.getAlumniMapLocations();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách vị trí cựu sinh viên thành công", locations));
    }
}
