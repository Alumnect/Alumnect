import { useMutation, useQueryClient } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'
import type { CreatePostInput } from '../model/createPost'

/**
 * Hook chỉnh sửa bài viết (UC22 - Edit a post).
 * Bọc `useMutation` của TanStack Query gọi `feedApi.editPost`.
 * Khi chỉnh sửa thành công, invalidate cache bảng tin (`['feed']`) và bài viết chi tiết (`['post', postId]`)
 * để dữ liệu tự động đồng bộ trên UI.
 */
export function useEditPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, input }: { postId: string; input: CreatePostInput }) =>
      feedApi.editPost(postId, input),
    onSuccess: (updatedPost) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['post', updatedPost.id] })
    },
  })
}
