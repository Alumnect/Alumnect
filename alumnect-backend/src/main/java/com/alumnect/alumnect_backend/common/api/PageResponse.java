package com.alumnect.alumnect_backend.common.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Lớp bọc kết quả phản hồi có phân trang (Pagination Response Wrapper).
 * 
 * @param <T> Kiểu dữ liệu của các phần tử trong trang
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    /** Danh sách các phần tử dữ liệu trong trang hiện tại */
    private List<T> content;

    /** Số thứ tự trang hiện tại (0-indexed) */
    private int pageNumber;

    /** Kích thước của trang (số phần tử tối đa trong 1 trang) */
    private int pageSize;

    /** Tổng số phần tử tìm thấy trong cơ sở dữ liệu */
    private long totalElements;

    /** Tổng số trang dựa trên tổng số phần tử và kích thước trang */
    private int totalPages;

    /** true nếu đây là trang cuối cùng */
    private boolean last;
}
