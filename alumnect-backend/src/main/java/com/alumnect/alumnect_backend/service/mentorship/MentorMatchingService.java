package com.alumnect.alumnect_backend.service.mentorship;

import com.alumnect.alumnect_backend.common.enums.MentoringType;
import com.alumnect.alumnect_backend.common.enums.MentoringWorkingMode;
import com.alumnect.alumnect_backend.entity.mentorship.MentorProfile;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringRequest;

import java.util.List;

/**
 * Interface định nghĩa dịch vụ nội bộ tìm kiếm Mentor phù hợp và phân phối yêu cầu Mentoring (UC100).
 * Tuân thủ quy tắc BR-03 (Supported Field Matching) và BR-04 (Internal Matching).
 */
public interface MentorMatchingService {

    /**
     * Tìm danh sách các Mentor ACTIVE đủ điều kiện tiếp nhận yêu cầu dựa trên lĩnh vực ngành nghề và hình thức hỗ trợ.
     *
     * @param industryId ID ngành nghề / lĩnh vực cần hỗ trợ
     * @param workingMode Hình thức làm việc của yêu cầu (ONLINE, OFFLINE, BOTH)
     * @param participationType Hình thức tham gia (INDIVIDUAL, GROUP, BOTH)
     * @return Danh sách các hồ sơ Mentor phù hợp
     */
    List<MentorProfile> findMatchingMentors(Long industryId, MentoringWorkingMode workingMode, MentoringType participationType);

    /**
     * Tìm danh sách các Mentor ACTIVE phù hợp, loại trừ các user là thành viên tham gia yêu cầu (Conflict of Interest).
     */
    List<MentorProfile> findMatchingMentors(Long industryId, MentoringWorkingMode workingMode, MentoringType participationType, java.util.Set<Long> excludedUserIds);

    /**
     * Thực hiện phân phối yêu cầu tới các Mentor đã được matching và lưu vết vào cơ sở dữ liệu.
     * Đảm bảo tính nhất quán và không gửi trùng lặp (BR-10).
     *
     * @param request Yêu cầu Mentoring cần phân phối
     * @param matchingMentors Danh sách các Mentor phù hợp
     * @return Số lượng Mentor đã được phân phối thành công
     */
    int distributeRequestToMentors(MentoringRequest request, List<MentorProfile> matchingMentors);
}
