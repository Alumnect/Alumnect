import { useMutation, useQueryClient } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'
import type { CreatePostInput } from '../model/createPost'

/**
 * Hook tạo bài viết mới (UC14 - Create a post on the Feed).
 * Bọc `useMutation` của TanStack Query gọi `feedApi.createPost`. Khi tạo thành công,
 * invalidate cache bảng tin (`['feed']`) để danh sách tự động tải lại và hiển thị
 * bài viết vừa đăng ở đầu trang.
 * @return Đối tượng mutation (mutate/mutateAsync, isPending, isError, error, reset...)
 */
export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePostInput) => feedApi.createPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}
