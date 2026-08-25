package com.alumnect.alumnect_backend.dao.alumnimap;

import com.alumnect.alumnect_backend.entity.user.Experience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AlumniMapRepository extends JpaRepository<Experience, Long> {

    @Query("SELECT e.user.id as userId, up.major.id as majorId, up.fullName as fullName, up.avatarUrl as avatarUrl, " +
           "u.isAccountVerified as verified, e.title as title, e.company as company, " +
           "e.location as location, e.locationCity as locationCity, e.locationCountry as locationCountry, " +
           "e.locationCountryCode as locationCountryCode, e.latitude as latitude, e.longitude as longitude, " +
           "e.startDate as startDate, up.cohort as cohort " +
           "FROM Experience e " +
           "JOIN e.user u " +
           "JOIN u.profile up " +
           "WHERE e.isPrimary = true " +
           "AND e.isCurrent = true " +
           "AND e.latitude IS NOT NULL " +
           "AND e.longitude IS NOT NULL " +
           "AND u.accountStatus = com.alumnect.alumnect_backend.common.enums.AccountStatus.ACTIVE " +
           "AND u.role.name = 'ALUMNI' " +
           "AND (:search IS NULL OR LOWER(up.fullName) LIKE :search OR LOWER(e.title) LIKE :search OR LOWER(e.company) LIKE :search OR LOWER(e.location) LIKE :search) " +
           "AND (:title IS NULL OR LOWER(e.title) LIKE :title) " +
           "AND (:company IS NULL OR LOWER(e.company) LIKE :company) " +
           "AND (:location IS NULL OR LOWER(e.location) LIKE :location) " +
           "AND (:cohort IS NULL OR up.cohort = :cohort) " +
           "AND (:majorId IS NULL OR up.major.id = :majorId)")
    List<AlumniMapProjection> findAlumniMapLocations(
            @Param("search") String search,
            @Param("title") String title,
            @Param("company") String company,
            @Param("location") String location,
            @Param("cohort") Integer cohort,
            @Param("majorId") Long majorId
    );
}
