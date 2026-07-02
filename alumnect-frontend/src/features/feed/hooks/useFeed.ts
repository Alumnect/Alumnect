import { useInfiniteQuery } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'
import type { FeedFilter } from '../model/post'

/**
 * Hook lấy bảng tin cộng đồng theo kiểu phân trang vô hạn (infinite scroll).
 * Bọc `useInfiniteQuery` của TanStack Query: tự cache theo bộ lọc, quản lý
 * trạng thái loading/error và tải trang kế tiếp khi người dùng cuộn tới cuối.
 * @param filter Bộ lọc loại bài viết ('all' = tất cả)
 * @return Đối tượng query (pages, isLoading, isError, fetchNextPage, hasNextPage...)
 */
export function useFeed(filter: FeedFilter = 'all') {
  return useInfiniteQuery({
    queryKey: ['feed', filter],
    queryFn: ({ pageParam }) => feedApi.getFeed({ page: pageParam, filter }),
    initialPageParam: 0,
    // Trang kế tiếp = số trang hiện tại + 1, hoặc dừng khi hết dữ liệu.
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  })
}
