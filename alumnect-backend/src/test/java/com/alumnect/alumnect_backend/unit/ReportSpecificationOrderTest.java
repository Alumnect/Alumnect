package com.alumnect.alumnect_backend.unit;

import com.alumnect.alumnect_backend.entity.report.Report;
import com.alumnect.alumnect_backend.specification.report.ReportSpecification;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.domain.Specification;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ReportSpecificationOrderTest {

    @Test
    @SuppressWarnings("unchecked")
    void sortsReportsByNewestCreatedAtThenId() {
        Root<Report> root = mock(Root.class);
        CriteriaQuery<?> query = mock(CriteriaQuery.class);
        CriteriaBuilder criteriaBuilder = mock(CriteriaBuilder.class);
        Path<Object> postPath = mock(Path.class);
        Path<Object> createdAtPath = mock(Path.class);
        Path<Object> idPath = mock(Path.class);
        Predicate predicate = mock(Predicate.class);
        Order newestFirst = mock(Order.class);
        Order idTieBreak = mock(Order.class);

        doReturn(postPath).when(root).get("post");
        doReturn(createdAtPath).when(root).get("createdAt");
        doReturn(idPath).when(root).get("id");
        when(criteriaBuilder.isNotNull(postPath)).thenReturn(predicate);
        when(criteriaBuilder.desc(createdAtPath)).thenReturn(newestFirst);
        when(criteriaBuilder.desc(idPath)).thenReturn(idTieBreak);
        when(criteriaBuilder.and(any(Predicate[].class))).thenReturn(predicate);

        Specification<Report> specification = ReportSpecification.filterReports(
                null, null, null, null, null, null, null);
        specification.toPredicate(root, query, criteriaBuilder);

        verify(query).orderBy(newestFirst, idTieBreak);
    }
}
