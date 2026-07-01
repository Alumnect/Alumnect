package com.alumnect.alumnect_backend.dto.response.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO chứa thông tin trả về của chuyên ngành học cho phía Client.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MajorResponse {

    /** ID chuyên ngành */
    private Long id;

    /** Mã chuyên ngành (VD: SE, AI) */
    private String code;

    /** Tên đầy đủ chuyên ngành (VD: Kỹ thuật phần mềm) */
    private String name;
}
