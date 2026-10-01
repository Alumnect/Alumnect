package com.alumnect.alumnect_backend.common.constant;

import java.util.List;

/**
 * Danh sách danh mục hoạt động hợp lệ của hội nhóm. Frontend gửi lên khóa (value); Backend chỉ chấp nhận
 * các khóa nằm trong danh sách này, không nhận giá trị tự do.
 */
public final class GroupCategories {

    private GroupCategories() {
    }

    public static final List<String> VALUES = List.of(
            "technology", "sports", "arts", "startup", "business", "alumni", "career", "academic", "other");

    public static boolean isValid(String category) {
        return category != null && VALUES.contains(category);
    }
}
