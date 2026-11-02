import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'
import type { CreatePostInput } from '../model/createPost'
import type { FeedPageResult, Post } from '../model/post'

/**
 * Hook tạo bài viết mới (UC14 - Create a post on the Feed).
 * Bọc `useMutation` của TanStack Query gọi `feedApi.createPost`. Khi tạo thành công:
 * - Chèn ngay bài viết mới vào đầu cache bảng tin (Optimistic Prepend tương tự Facebook/Instagram)
 *   giúp người dùng thấy ngay bài của mình trên đầu trang.
 * - Cuộn mượt màn hình lên đầu trang.
 * - Khi người dùng F5 hoặc Tải lại trang (reset), bài viết sẽ hòa vào dòng chảy xếp hạng tự nhiên.
 * @return Đối tượng mutation (mutate/mutateAsync, isPending, isError, error, reset...)
 */
export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreatePostInput) => feedApi.createPost(input),
    onSuccess: (newPost: Post) => {
      // 1. Chèn tức thì bài viết mới vào đầu bảng tin hiện tại trong cache
      queryClient.setQueriesData<InfiniteData<FeedPageResult>>(
        { queryKey: ['feed'] },
        (oldData) => {
          if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData
          const firstPage = oldData.pages[0]
          return {
            ...oldData,
            pages: [
              {
                ...firstPage,
                items: [newPost, ...firstPage.items.filter((p) => p.id !== newPost.id)],
              },
              ...oldData.pages.slice(1),
            ],
          }
        },
      )

      // 2. Tự động cuộn mượt lên đầu trang để người dùng xem bài viết vừa đăng
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },
  })
}

