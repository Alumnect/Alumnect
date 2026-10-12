package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorRankingResponse;
import org.springframework.data.domain.Pageable;

/**
 * Giao diện dịch vụ xử lý nghiệp vụ Xem bảng xếp hạng Mentor theo lĩnh vực chuyên môn (UC97).
 * Cung cấp chức năng truy vấn bảng xếp hạng Mentor cho sinh viên và cựu sinh viên theo từng ngành nghề.
 */
public interface MentorRankingService {

    /**
     * Lấy danh sách bảng xếp hạng Mentor được lọc và tính toán theo lĩnh vực chuyên môn.
     *
     * @param fieldId ID của lĩnh vực chuyên môn (ngành nghề / Industry)
     * @param pageable Tham số phân trang (trang hiện tại, kích thước trang)
     * @return Đối tượng PageResponse chứa danh sách Mentor đã được tính thứ hạng toàn cục
     */
    PageResponse<MentorRankingResponse> getMentorRanking(Long fieldId, Pageable pageable);
}
