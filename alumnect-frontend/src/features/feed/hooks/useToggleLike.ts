import { useMutation } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'
import type { LikeResult } from '../api/feedApi'

/**
 * Hook thích/bỏ thích một bài viết (UC17 - Like a post).
 *
 * Bọc `useMutation` của TanStack Query: chọn endpoint theo cờ `like`
 * (POST /like khi thích, DELETE /like khi bỏ thích) và trả về trạng thái like
 * mới do backend xác nhận ({ liked, likeCount }).
 *
 * UI dùng cập nhật lạc quan (optimistic) cục bộ ở component: đổi trạng thái
 * ngay khi bấm, rồi đồng bộ theo `onSuccess` hoặc hoàn tác (rollback) ở `onError`.
 * Vì thế hook không tự invalidate cache bảng tin — trạng thái được giữ nhất quán
 * qua điều hướng nhờ các màn tự tải lại dữ liệu (useFeed/usePostDetail).
 *
 * @return Đối tượng mutation (mutate, isPending, ...) nhận `{ postId, like }`
 */
export function useToggleLike() {
  return useMutation<LikeResult, Error, { postId: string; like: boolean }>({
    mutationFn: ({ postId, like }) =>
      like ? feedApi.likePost(postId) : feedApi.unlikePost(postId),
  })
}
