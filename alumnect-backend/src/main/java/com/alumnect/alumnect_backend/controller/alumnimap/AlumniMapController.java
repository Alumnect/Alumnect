package com.alumnect.alumnect_backend.controller.alumnimap;

import com.alumnect.alumnect_backend.common.api.ApiResponse;
import com.alumnect.alumnect_backend.dto.response.alumnimap.AlumniMapResponse;
import com.alumnect.alumnect_backend.service.alumnimap.AlumniMapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/alumni-map")
@RequiredArgsConstructor
@Slf4j
public class AlumniMapController {

    private final AlumniMapService alumniMapService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AlumniMapResponse>>> getAlumniMapLocations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer cohort,
            @RequestParam(required = false) Long majorId
    ) {
        log.info("Nhận yêu cầu HTTP GET lấy danh sách vị trí cựu sinh viên với bộ lọc");
        List<AlumniMapResponse> locations = alumniMapService.getAlumniMapLocations(
                search, title, company, location, cohort, majorId
        );
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách vị trí cựu sinh viên thành công", locations));
    }
}
