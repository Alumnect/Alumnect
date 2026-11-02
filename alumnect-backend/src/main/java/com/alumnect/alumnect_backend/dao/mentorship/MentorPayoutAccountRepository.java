package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.MentorPayoutAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository truy vấn và thao tác dữ liệu bảng mentor_payout_accounts.
 */
@Repository
public interface MentorPayoutAccountRepository extends JpaRepository<MentorPayoutAccount, Long> {

    /**
     * Tìm thông tin tài khoản ngân hàng chi trả theo mentorProfileId.
     */
    Optional<MentorPayoutAccount> findByMentorProfileId(Long mentorProfileId);
}
