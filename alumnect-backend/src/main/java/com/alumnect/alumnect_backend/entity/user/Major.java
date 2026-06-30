package com.alumnect.alumnect_backend.entity.user;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity ánh xạ bảng majors — danh mục chuyên ngành học.
 * Gồm mã chuyên ngành (VD: SE, AI) và tên đầy đủ (VD: Kỹ thuật phần mềm).
 */
@Entity
@Table(name = "majors")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Major {
    
    /** Khóa chính tự tăng */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã chuyên ngành (VD: SE, AI) — duy nhất */
    @Column(nullable = false, unique = true, length = 20)
    private String code;

    /** Tên đầy đủ của chuyên ngành học (VD: Kỹ thuật phần mềm) */
    @Column(nullable = false, length = 150)
    private String name;
}
