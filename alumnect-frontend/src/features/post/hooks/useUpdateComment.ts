import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { postApi } from '../api/postApi'
import type { Comment, CommentsPageResult } from '../model/comment'

/**
 * Hook chỉnh sửa bình luận (UC19).
 * Khi thành công, thay thế đúng comment trong toàn bộ các trang cache để giao diện cập nhật tức thì.
 */
export function useUpdateComment(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      postApi.updateComment(postId, commentId, content),
    onSuccess: (updatedComment) => {
      queryClient.setQueryData<InfiniteData<CommentsPageResult>>(['post-comments', postId], (old) => {
        if (!old) return old

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((comment): Comment =>
              comment.id === updatedComment.id ? updatedComment : comment,
            ),
          })),
        }
      })
    },
  })
}
