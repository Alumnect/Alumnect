import { useInfiniteQuery } from '@tanstack/react-query'
import { eventApi } from '../api/eventApi'
import type { EventHistoryFilter } from '../model/event'

/**
 * Hook lấy lịch sử tham gia sự kiện của người dùng (UC28 - View attended-event history)
 * Tự động đồng bộ với TanStack Query cache, hỗ trợ lọc theo trạng thái và tải thêm trang.
 *
 * @param filter Bộ lọc trạng thái ('all' | 'upcoming' | 'past' | 'cancelled')
 */
export function useEventHistory(filter: EventHistoryFilter = 'all') {
  return useInfiniteQuery({
    queryKey: ['event-history', filter],
    queryFn: ({ pageParam = 0 }) => eventApi.getEventHistory(pageParam, 9, filter),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last || lastPage.pageNumber + 1 >= lastPage.totalPages) {
        return undefined
      }
      return lastPage.pageNumber + 1
    },
  })
}
