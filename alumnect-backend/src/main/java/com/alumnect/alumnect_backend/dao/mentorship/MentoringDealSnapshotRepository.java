package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentoringDealSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository truy xuất lịch sử các phiên bản Snapshot của Mentoring Deal (UC104).
 */
@Repository
public interface MentoringDealSnapshotRepository extends JpaRepository<MentoringDealSnapshot, Long> {

    /**
     * Lấy toàn bộ lịch sử snapshot của một thỏa thuận sắp xếp theo phiên bản tăng dần.
     *
     * @param dealId ID của thỏa thuận Deal
     * @return Danh sách snapshot theo thứ tự phiên bản
     */
    @Query("SELECT s FROM MentoringDealSnapshot s " +
           "LEFT JOIN FETCH s.modifiedBy " +
           "WHERE s.deal.id = :dealId " +
           "ORDER BY s.version ASC")
    List<MentoringDealSnapshot> findByDealIdOrderByVersionAsc(@Param("dealId") Long dealId);

    /**
     * Lấy snapshot phiên bản cụ thể của một thỏa thuận Deal.
     *
     * @param dealId ID thỏa thuận Deal
     * @param version Số thứ tự phiên bản
     * @return Snapshot tương ứng nếu tồn tại
     */
    Optional<MentoringDealSnapshot> findByDealIdAndVersion(Long dealId, Integer version);
}
