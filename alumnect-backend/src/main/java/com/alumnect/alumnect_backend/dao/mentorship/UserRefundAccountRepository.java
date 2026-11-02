package com.alumnect.alumnect_backend.dao.mentorship;

import com.alumnect.alumnect_backend.entity.mentorship.UserRefundAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRefundAccountRepository extends JpaRepository<UserRefundAccount, Long> {

    Optional<UserRefundAccount> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
