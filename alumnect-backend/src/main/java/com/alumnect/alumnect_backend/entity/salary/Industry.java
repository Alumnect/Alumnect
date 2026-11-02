package com.alumnect.alumnect_backend.entity.salary;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity ánh xạ bảng industries — danh mục ngành nghề dùng cho Salary Board (UC50 - Contribute salary data).
 */
@Entity
@Table(name = "industries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Industry {

    /** Khóa chính, tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tên ngành nghề (VD: "Công nghệ thông tin") — duy nhất */
    @Column(nullable = false, unique = true, length = 120)
    private String name;
}
