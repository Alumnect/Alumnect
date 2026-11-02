package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.api.PageResponse;
import com.alumnect.alumnect_backend.dto.request.mentorship.MentorSearchCriteria;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorCardResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentorFilterOptionsResponse;
import org.springframework.data.domain.Pageable;

/**
 * Giao diện dịch vụ nghiệp vụ Tìm kiếm & Lọc Mentor (UC98).
 * Cung cấp chức năng tìm kiếm kết hợp đa bộ lọc và lấy danh mục tùy chọn bộ lọc cho Client.
 */
public interface MentorSearchService {

    /**
     * Tìm kiếm và lọc danh sách Mentor đủ điều kiện hoạt động với phân trang.
     * Chỉ những Mentor có trạng thái ACTIVE và gói đăng ký còn hiệu lực mới xuất hiện trong kết quả.
     *
     * @param criteria Tiêu chí tìm kiếm và bộ lọc từ Client
     * @param pageable Tham số phân trang (trang hiện tại, kích thước trang, sắp xếp)
     * @return Đối tượng PageResponse chứa danh sách MentorCardResponse kèm metadata phân trang
     */
    PageResponse<MentorCardResponse> searchMentors(MentorSearchCriteria criteria, Pageable pageable);

    /**
     * Lấy danh mục các tùy chọn bộ lọc động (Ngành nghề, Chuyên ngành, Hình thức, Loại hình, Kỹ năng phổ biến)
     * phục vụ hiển thị các thành phần lọc trên giao diện người dùng.
     *
     * @return Đối tượng MentorFilterOptionsResponse chứa danh sách các tùy chọn
     */
    MentorFilterOptionsResponse getFilterOptions();
}
