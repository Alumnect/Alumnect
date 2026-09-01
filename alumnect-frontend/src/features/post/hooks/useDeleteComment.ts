import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import type { Post } from '@/features/feed'
import { postApi } from '../api/postApi'
import type { CommentsPageResult } from '../model/comment'

/**
 * Hook xóa bình luận (UC20).
 * Khi thành công, loại bình luận khỏi cache ngay, giảm bộ đếm và làm mới các danh sách liên quan
 * để dữ liệu phân trang tiếp tục khớp với máy chủ.
 */
export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) => postApi.deleteComment(postId, commentId),
    onSuccess: (_, deletedCommentId) => {
      queryClient.setQueryData<InfiniteData<CommentsPageResult>>(['post-comments', postId], (old) => {
        if (!old) return old
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.filter((comment) => comment.id !== deletedCommentId),
          })),
        }
      })

      queryClient.setQueryData<Post>(['post', postId], (old) =>
        old ? { ...old, comments: Math.max(0, old.comments - 1) } : old,
      )

      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
