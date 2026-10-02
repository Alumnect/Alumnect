import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { groupApi } from '../api/groupApi'

/**
 * Hook lấy danh sách khám phá hội nhóm theo phân trang vô hạn (infinite scroll), có tìm kiếm và lọc danh mục.
 * @param keyword Từ khóa tìm kiếm (đã debounce phía Component), rỗng = không tìm
 * @param category Khóa danh mục cần lọc, rỗng = tất cả
 */
export function useGroups(keyword: string = '', category: string = '') {
  const keywordKey = keyword.trim().toLowerCase()
  return useInfiniteQuery({
    queryKey: ['groups', keywordKey, category],
    queryFn: ({ pageParam }) => groupApi.list({ page: pageParam, keyword: keywordKey, category }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  })
}

/** Hook lấy các hội nhóm tôi đang tham gia (chỉ gọi khi đã đăng nhập). */
export function useMyGroups(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['my-groups'],
    queryFn: ({ pageParam }) => groupApi.myGroups({ page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled,
  })
}

/**
 * Hook lấy chi tiết một hội nhóm. Không tự thử lại khi 404 (nhóm không tồn tại/đã xóa) để hiện ngay trạng thái "không tìm thấy".
 * @param id ID hội nhóm (undefined khi chưa có → không gọi API)
 * @param viewerKey Định danh người xem (id người dùng hoặc 'guest') để cache tách theo người xem, vì dữ liệu phụ thuộc quyền
 */
export function useGroupDetail(id: string | undefined, viewerKey: string = 'guest') {
  return useQuery({
    queryKey: ['group', id, viewerKey],
    queryFn: () => groupApi.getById(id as string),
    enabled: !!id,
    retry: false,
  })
}

/** Hook lấy danh sách thành viên ACTIVE (phân trang vô hạn, có tìm theo tên). */
export function useGroupMembers(id: number | undefined, keyword: string, enabled: boolean) {
  const keywordKey = keyword.trim().toLowerCase()
  return useInfiniteQuery({
    queryKey: ['group-members', id, keywordKey],
    queryFn: ({ pageParam }) => groupApi.members(id as number, { page: pageParam, keyword: keywordKey }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: enabled && id !== undefined,
    placeholderData: keepPreviousData,
    retry: false,
  })
}

/** Hook lấy các yêu cầu tham gia đang chờ duyệt (chỉ Owner/Admin). */
export function useJoinRequests(id: number | undefined, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['group-requests', id],
    queryFn: ({ pageParam }) => groupApi.joinRequests(id as number, { page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    enabled: enabled && id !== undefined,
    retry: false,
  })
}
