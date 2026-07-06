import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { forumApi } from '../api/forumApi'
import type { SortOption } from '../model/question'

/**
 * Hook lấy danh sách câu hỏi diễn đàn theo phân trang vô hạn (infinite scroll).
 * Bọc `useInfiniteQuery`: tự cache theo (sort, topicId), quản lý loading/error và
 * tải trang kế tiếp khi người dùng cuộn/bấm "Tải thêm".
 * @param sort Tiêu chí sắp xếp ('recent' | 'votes' | 'answers')
 * @param topicId ID chủ đề để lọc, hoặc null = tất cả
 * @return Đối tượng query (pages, isLoading, isError, fetchNextPage, hasNextPage...)
 */
export function useQuestions(sort: SortOption = 'recent', topicId: number | null = null) {
  return useInfiniteQuery({
    queryKey: ['questions', sort, topicId],
    queryFn: ({ pageParam }) => forumApi.getQuestions({ page: pageParam, sort, topicId }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  })
}

/**
 * Hook lấy danh mục chủ đề diễn đàn (cho bộ lọc). Dữ liệu ít thay đổi nên cache lâu.
 * @return Đối tượng query chứa danh sách chủ đề
 */
export function useTopics() {
  return useQuery({
    queryKey: ['forum-topics'],
    queryFn: () => forumApi.getTopics(),
    staleTime: 5 * 60 * 1000,
  })
}
