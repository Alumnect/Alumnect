import { useQuery } from '@tanstack/react-query'
import { postApi } from '../api/postApi'

/**
 * Hook lấy chi tiết một bài viết (UC16 - View Post Detail).
 * Bọc `useQuery` của TanStack Query: tự cache theo ID bài viết và quản lý trạng thái
 * loading/error. Tắt retry để lỗi 404 (không tồn tại/đã ẩn) hoặc 403 (không có quyền)
 * hiển thị ngay thay vì thử lại nhiều lần.
 * @param id ID bài viết cần xem chi tiết
 * @return Đối tượng query (data, isLoading, isError, error, refetch...)
 */
export function usePostDetail(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => postApi.getPostDetail(id),
    enabled: !!id,
    retry: false,
  })
}
