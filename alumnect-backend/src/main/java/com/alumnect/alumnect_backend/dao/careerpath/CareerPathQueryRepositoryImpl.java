package com.alumnect.alumnect_backend.dao.careerpath;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CareerPathQueryRepositoryImpl implements CareerPathQueryRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<Long> findActiveAlumniUserIds(
            String search,
            String title,
            String company,
            String location,
            Integer cohort,
            Long majorId,
            Pageable pageable
    ) {
        StringBuilder jpql = new StringBuilder("SELECT up.userId FROM UserProfile up JOIN up.user u WHERE u.accountStatus = com.alumnect.alumnect_backend.common.enums.AccountStatus.ACTIVE AND u.role.name = 'ALUMNI'");
        StringBuilder countJpql = new StringBuilder("SELECT COUNT(up.userId) FROM UserProfile up JOIN up.user u WHERE u.accountStatus = com.alumnect.alumnect_backend.common.enums.AccountStatus.ACTIVE AND u.role.name = 'ALUMNI'");
        
        StringBuilder where = new StringBuilder();
        
        if (search != null && !search.trim().isEmpty()) {
            where.append(" AND (LOWER(up.fullName) LIKE :searchPattern OR EXISTS (SELECT 1 FROM Experience e WHERE e.user.id = u.id AND (LOWER(e.title) LIKE :searchPattern OR LOWER(e.company) LIKE :searchPattern OR LOWER(e.location) LIKE :searchPattern)))");
        }
        if (title != null && !title.trim().isEmpty()) {
            where.append(" AND EXISTS (SELECT 1 FROM Experience e WHERE e.user.id = u.id AND LOWER(e.title) LIKE :titlePattern)");
        }
        if (company != null && !company.trim().isEmpty()) {
            where.append(" AND EXISTS (SELECT 1 FROM Experience e WHERE e.user.id = u.id AND LOWER(e.company) LIKE :companyPattern)");
        }
        if (location != null && !location.trim().isEmpty()) {
            where.append(" AND EXISTS (SELECT 1 FROM Experience e WHERE e.user.id = u.id AND LOWER(e.location) LIKE :locationPattern)");
        }
        if (cohort != null) {
            where.append(" AND up.cohort = :cohort");
        }
        if (majorId != null) {
            where.append(" AND up.major.id = :majorId");
        }
        
        jpql.append(where);
        countJpql.append(where);
        
        jpql.append(" ORDER BY up.userId DESC");
        
        TypedQuery<Long> query = entityManager.createQuery(jpql.toString(), Long.class);
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql.toString(), Long.class);
        
        if (search != null && !search.trim().isEmpty()) {
            String p = "%" + search.trim().toLowerCase() + "%";
            query.setParameter("searchPattern", p);
            countQuery.setParameter("searchPattern", p);
        }
        if (title != null && !title.trim().isEmpty()) {
            String p = "%" + title.trim().toLowerCase() + "%";
            query.setParameter("titlePattern", p);
            countQuery.setParameter("titlePattern", p);
        }
        if (company != null && !company.trim().isEmpty()) {
            String p = "%" + company.trim().toLowerCase() + "%";
            query.setParameter("companyPattern", p);
            countQuery.setParameter("companyPattern", p);
        }
        if (location != null && !location.trim().isEmpty()) {
            String p = "%" + location.trim().toLowerCase() + "%";
            query.setParameter("locationPattern", p);
            countQuery.setParameter("locationPattern", p);
        }
        if (cohort != null) {
            query.setParameter("cohort", cohort);
            countQuery.setParameter("cohort", cohort);
        }
        if (majorId != null) {
            query.setParameter("majorId", majorId);
            countQuery.setParameter("majorId", majorId);
        }
        
        Long total = countQuery.getSingleResult();
        
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());
        
        List<Long> result = query.getResultList();
        
        return new PageImpl<>(result, pageable, total);
    }
}
