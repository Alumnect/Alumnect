import { useInfiniteQuery } from '@tanstack/react-query'
import { postApi } from '../api/postApi'

/**
 * Hook lấy luồng bình luận của một bài viết theo kiểu tải thêm (UC16 - View Post Detail).
 * Bọc `useInfiniteQuery` của TanStack Query: tự cache theo ID bài viết, quản lý trạng thái
 * loading/error và tải trang bình luận kế tiếp khi người dùng bấm "Xem thêm bình luận".
 * @param id ID bài viết cần lấy bình luận
 * @return Đối tượng query (pages, isLoading, isError, fetchNextPage, hasNextPage...)
 */
export function useComments(id: string) {
  return useInfiniteQuery({
    queryKey: ['post-comments', id],
    queryFn: ({ pageParam }) => postApi.getPostComments(id, pageParam),
    initialPageParam: 0,
    // Trang kế tiếp = số trang hiện tại + 1, hoặc dừng khi hết dữ liệu.
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: !!id,
  })
}
