import { useInfiniteQuery } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'

/**
 * Hook lấy danh sách bài viết đã lưu theo phân trang vô hạn (UC21 - View Saved Posts).
 * Bọc `useInfiniteQuery` của TanStack Query: cache dữ liệu với key `['saved-posts']`,
 * tự động tải trang kế tiếp khi người dùng cuộn đến cuối danh sách.
 *
 * @return Đối tượng query (data, isLoading, isError, fetchNextPage, hasNextPage, refetch...)
 */
export function useSavedPosts() {
  return useInfiniteQuery({
    queryKey: ['saved-posts'],
    queryFn: ({ pageParam }) => feedApi.getSavedPosts({ page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  })
}
