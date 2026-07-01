package com.alumnect.alumnect_backend.entity.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity ánh xạ bảng roles — danh mục vai trò người dùng.
 * Giá trị seed sẵn: STUDENT, ALUMNI, ADMIN.
 */
@Entity
@Table(name = "roles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Role {
    
    /** Khóa chính tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Tên vai trò (STUDENT, ALUMNI, ADMIN) — duy nhất */
    @Column(nullable = false, unique = true, length = 20)
    private String name;
}
