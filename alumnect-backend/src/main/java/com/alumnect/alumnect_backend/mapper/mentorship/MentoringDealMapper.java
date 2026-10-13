package com.alumnect.alumnect_backend.mapper.mentorship;

import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealResponse;
import com.alumnect.alumnect_backend.dto.response.mentorship.MentoringDealSnapshotResponse;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDeal;
import com.alumnect.alumnect_backend.entity.mentorship.MentoringDealSnapshot;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * Interface Mapper chuyển đổi dữ liệu giữa Entity MentoringDeal/Snapshot và các Response DTO tương ứng (UC104).
 */
@Mapper(componentModel = "spring")
public interface MentoringDealMapper {

    /**
     * Chuyển đổi từ Entity MentoringDeal sang MentoringDealResponse DTO.
     *
     * @param deal Entity thỏa thuận Deal
     * @return DTO phản hồi Deal
     */
    @Mapping(target = "ticketId", source = "id")
    @Mapping(target = "studentId", source = "student.id")
    @Mapping(target = "studentName", source = "student.profile.fullName")
    @Mapping(target = "studentAvatar", source = "student.profile.avatarUrl")
    @Mapping(target = "studentEmail", source = "student.email")
    @Mapping(target = "mentorId", source = "mentor.id")
    @Mapping(target = "mentorName", source = "mentor.profile.fullName")
    @Mapping(target = "mentorAvatar", source = "mentor.profile.avatarUrl")
    @Mapping(target = "mentorEmail", source = "mentor.email")
    @Mapping(target = "conversationId", source = "conversation.id")
    @Mapping(target = "createdByUserId", source = "createdBy.id")
    @Mapping(target = "createdByName", source = "createdBy.profile.fullName")
    @Mapping(target = "updatedByUserId", source = "updatedBy.id")
    @Mapping(target = "updatedByName", source = "updatedBy.profile.fullName")
    @Mapping(target = "canConfirm", ignore = true)
    @Mapping(target = "canEdit", ignore = true)
    @Mapping(target = "taskId", ignore = true)
    MentoringDealResponse toResponse(MentoringDeal deal);

    /**
     * Chuyển đổi danh sách MentoringDeal sang danh sách MentoringDealResponse DTO.
     *
     * @param deals Danh sách Entity MentoringDeal
     * @return Danh sách DTO phản hồi
     */
    List<MentoringDealResponse> toResponseList(List<MentoringDeal> deals);

    /**
     * Chuyển đổi từ Entity MentoringDealSnapshot sang MentoringDealSnapshotResponse DTO.
     *
     * @param snapshot Entity snapshot phiên bản
     * @return DTO phản hồi snapshot
     */
    @Mapping(target = "dealId", source = "deal.id")
    @Mapping(target = "modifiedByUserId", source = "modifiedBy.id")
    @Mapping(target = "modifiedByName", source = "modifiedBy.profile.fullName")
    @Mapping(target = "modifiedByAvatar", source = "modifiedBy.profile.avatarUrl")
    MentoringDealSnapshotResponse toSnapshotResponse(MentoringDealSnapshot snapshot);

    /**
     * Chuyển đổi danh sách Entity MentoringDealSnapshot sang danh sách DTO.
     *
     * @param snapshots Danh sách Entity snapshot
     * @return Danh sách DTO phản hồi
     */
    List<MentoringDealSnapshotResponse> toSnapshotResponseList(List<MentoringDealSnapshot> snapshots);
}
