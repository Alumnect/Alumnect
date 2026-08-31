import { useMutation, useQueryClient } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'
import type { SaveResult } from '../api/feedApi'

/**
 * Hook lưu / bỏ lưu (bookmark) bài viết (UC20 - Save Post).
 *
 * Bọc `useMutation` của TanStack Query: gọi endpoint POST/DELETE theo cờ `save`
 * và tự động invalidate cache danh sách bài viết đã lưu `['saved-posts']` khi thao tác hoàn tất.
 *
 * @return Đối tượng mutation nhận `{ postId, save }`
 */
export function useToggleSavePost() {
  const queryClient = useQueryClient()

  return useMutation<SaveResult, Error, { postId: string; save: boolean }>({
    mutationFn: ({ postId, save }) =>
      save ? feedApi.savePost(postId) : feedApi.unsavePost(postId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] })
    },
  })
}
