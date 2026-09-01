import { useInfiniteQuery } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'

/**
 * Hook tải danh sách bài viết của một user cụ thể.
 * Hỗ trợ phân trang vô hạn (infinite scroll).
 */
export function useUserPosts(userId: string | number, category: string = 'all') {
  return useInfiniteQuery({
    queryKey: ['user-posts', String(userId), category],
    queryFn: ({ pageParam = 0 }) => feedApi.getUserPosts(userId, { page: pageParam, category }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: !!userId,
  })
}
