import { useMutation, useQueryClient } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'
import type { LikeResult } from '../api/feedApi'
import type { FeedPageResult, Post } from '../model/post'
import type { InfiniteData } from '@tanstack/react-query'

/**
 * Đồng bộ trạng thái like và số lượt thích của một bài viết vào toàn bộ cache React Query
 * (bảng tin, chi tiết bài viết, bài viết cá nhân, bài viết đã lưu) để khi chuyển qua lại
 * giữa danh sách và trang chi tiết không bị mất trạng thái do `staleTime`.
 */
export function syncPostLikeInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  postId: string,
  patch: { liked?: boolean; likes: number },
) {
  const pid = String(postId)

  queryClient.setQueriesData<InfiniteData<FeedPageResult>>(
    { queryKey: ['feed'] },
    (old) => {
      if (!old?.pages) return old
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            String(item.id) === pid
              ? { ...item, likes: patch.likes, ...(patch.liked !== undefined ? { liked: patch.liked } : {}) }
              : item,
          ),
        })),
      }
    },
  )

  queryClient.setQueryData<Post>(['post', pid], (old) =>
    old
      ? { ...old, likes: patch.likes, ...(patch.liked !== undefined ? { liked: patch.liked } : {}) }
      : old,
  )

  queryClient.setQueriesData<InfiniteData<FeedPageResult>>(
    { queryKey: ['user-posts'] },
    (old) => {
      if (!old?.pages) return old
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            String(item.id) === pid
              ? { ...item, likes: patch.likes, ...(patch.liked !== undefined ? { liked: patch.liked } : {}) }
              : item,
          ),
        })),
      }
    },
  )

  queryClient.setQueriesData<InfiniteData<FeedPageResult>>(
    { queryKey: ['saved-posts'] },
    (old) => {
      if (!old?.pages) return old
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            String(item.id) === pid
              ? { ...item, likes: patch.likes, ...(patch.liked !== undefined ? { liked: patch.liked } : {}) }
              : item,
          ),
        })),
      }
    },
  )
}

/**
 * Hook thích/bỏ thích một bài viết (UC17 - Like a post).
 *
 * Bọc `useMutation` của TanStack Query: chọn endpoint theo cờ `like`
 * (POST /like khi thích, DELETE /like khi bỏ thích), cập nhật thẳng vào cache
 * React Query (`['feed']`, `['post', id]`, `['user-posts']`, `['saved-posts']`)
 * để chuyển trang Chi tiết <-> Bảng tin luôn giữ đúng số like và trạng thái đã thích.
 *
 * @return Đối tượng mutation (mutate, isPending, ...) nhận `{ postId, like }`
 */
export function useToggleLike() {
  const queryClient = useQueryClient()

  return useMutation<LikeResult, Error, { postId: string; like: boolean }>({
    mutationFn: ({ postId, like }) =>
      like ? feedApi.likePost(postId) : feedApi.unlikePost(postId),
    onSuccess: (data, { postId }) => {
      syncPostLikeInCache(queryClient, postId, {
        liked: data.liked,
        likes: data.likeCount,
      })
    },
  })
}
