import { useInfiniteQuery } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'
import type { FeedFilter } from '../model/post'

/**
 * Hook lấy danh sách bài viết của một người dùng cụ thể.
 * Bọc `useInfiniteQuery` của TanStack Query: cache dữ liệu với key `['user-posts', userId, filter]`,
 * tự động tải trang kế tiếp khi người dùng bấm tải thêm.
 *
 * @return Đối tượng query (data, isLoading, isError, fetchNextPage, hasNextPage, refetch...)
 */
export function useUserPosts(userId: string | number, filter: FeedFilter = 'all') {
  return useInfiniteQuery({
    queryKey: ['user-posts', userId, filter],
    queryFn: ({ pageParam }) => feedApi.getUserPosts(userId, { page: pageParam, filter }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  })
}
