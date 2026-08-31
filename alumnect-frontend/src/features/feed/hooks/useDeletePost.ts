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
      // Làm mới dữ liệu bảng tin để loại bỏ bài viết bị xóa khỏi UI ngay lập tức
      queryClient.invalidateQueries({ queryKey: ['feed'] })

      // Nếu đang xem chi tiết bài viết, làm mới cache của bài viết đó (mặc dù nó sẽ trả về 404 sau khi xóa)
      queryClient.invalidateQueries({ queryKey: ['post', deletedPostId] })
    },
  })
}
