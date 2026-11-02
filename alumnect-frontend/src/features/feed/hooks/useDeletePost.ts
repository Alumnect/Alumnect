import { useMutation, useQueryClient } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'

/**
 * Custom hook quản lý chức năng Xóa bài viết (UC23).
 * Sử dụng React Query để thực hiện call API và cập nhật giao diện sau khi thành công.
 */
export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (postId: string) => feedApi.deletePost(postId),
    onSuccess: (_, deletedPostId) => {
      // Invalidate tất cả các queries liên quan để đồng bộ cache UI tức thì
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['post'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] })
      queryClient.invalidateQueries({ queryKey: ['userPosts'] })
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event-history'] })
      queryClient.invalidateQueries({ queryKey: ['upcoming-events'] })
      queryClient.removeQueries({ queryKey: ['post', deletedPostId] })
    },
  })
}
