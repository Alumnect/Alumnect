package com.alumnect.alumnect_backend.dao.job;

import com.alumnect.alumnect_backend.entity.job.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
}
