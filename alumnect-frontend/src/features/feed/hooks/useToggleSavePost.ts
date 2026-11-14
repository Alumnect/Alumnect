import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { feedApi } from '../api/feedApi'
import type { SaveResult } from '../api/feedApi'
import type { FeedPageResult, Post } from '../model/post'

/**
 * Hook lưu / bỏ lưu (bookmark) bài viết (UC20 - Save Post).
 *
 * Bọc `useMutation` của TanStack Query: gọi endpoint POST/DELETE theo cờ `save`
 * và đồng bộ cache `['feed']`, `['post', id]`, `['user-posts']`, `['saved-posts']`.
 *
 * @return Đối tượng mutation nhận `{ postId, save }`
 */
export function useToggleSavePost() {
  const queryClient = useQueryClient()

  return useMutation<SaveResult, Error, { postId: string; save: boolean }>({
    mutationFn: ({ postId, save }) =>
      save ? feedApi.savePost(postId) : feedApi.unsavePost(postId),
    onSuccess: (data, variables) => {
      const pid = String(variables.postId)
      const saved = typeof data?.saved === 'boolean' ? data.saved : variables.save

      queryClient.setQueriesData<InfiniteData<FeedPageResult>>(
        { queryKey: ['feed'] },
        (old) => {
          if (!old?.pages) return old
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                String(item.id) === pid ? { ...item, saved } : item,
              ),
            })),
          }
        },
      )

      queryClient.setQueryData<Post>(['post', pid], (old) =>
        old ? { ...old, saved } : old,
      )

      queryClient.invalidateQueries({ queryKey: ['saved-posts'] })
    },
  })
}
