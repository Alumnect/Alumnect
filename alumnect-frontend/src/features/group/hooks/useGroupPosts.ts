import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { toast } from '@/components/ui'
import { groupApi } from '../api/groupApi'
import type { CreateGroupPostPayload, GroupComment, GroupPost } from '../model/group'

type GroupPostPage = Awaited<ReturnType<typeof groupApi.listPosts>>
type GroupCommentPage = Awaited<ReturnType<typeof groupApi.listComments>>

export const groupPostKeys = {
  all: ['group-posts'] as const,
  list: (groupId: number, size = 10, topic = '') => [...groupPostKeys.all, 'list', groupId, size, topic] as const,
  detail: (groupId: number, postId: number) => [...groupPostKeys.all, 'detail', groupId, postId] as const,
  comments: (groupId: number, postId: number, page?: number, size?: number) =>
    [...groupPostKeys.all, 'comments', groupId, postId, ...(page === undefined ? [] : [page, size ?? 20])] as const,
}

/**
 * Hook lấy danh sách bài viết / thảo luận trong nhóm theo phân trang vô hạn:
 * mỗi lần `fetchNextPage` sẽ nối thêm trang kế tiếp vào cuối danh sách (không thay thế các trang đã tải).
 * @param groupId ID hội nhóm
 * @param size Số bài viết mỗi trang
 */
export function useGroupPostsInfinite(groupId: number, size = 10, topic = '') {
  return useInfiniteQuery({
    queryKey: groupPostKeys.list(groupId, size, topic),
    queryFn: ({ pageParam }) => groupApi.listPosts(groupId, pageParam, size, topic || undefined),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.pageNumber + 1),
    enabled: Number.isFinite(groupId) && groupId > 0,
    staleTime: 1000 * 30, // 30s
  })
}

export function useGroupPostDetail(groupId: number, postId?: number) {
  return useQuery({
    queryKey: groupPostKeys.detail(groupId, postId ?? 0),
    queryFn: () => groupApi.getPostDetail(groupId, postId as number),
    enabled: Number.isFinite(postId) && (postId ?? 0) > 0,
    retry: false,
  })
}

/** Hook đăng bài thảo luận mới */
export function useCreateGroupPostMutation(groupId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateGroupPostPayload) => groupApi.createPost(groupId, payload),
    onSuccess: () => {
      toast.success('Đăng bài thảo luận thành công!')
      qc.invalidateQueries({ queryKey: [...groupPostKeys.all, 'list', groupId] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể đăng bài thảo luận. Vui lòng thử lại.')
    },
  })
}

/** Chỉnh sửa bài viết của chính tác giả và làm mới mọi bộ lọc chủ đề. */
export function useUpdateGroupPostMutation(groupId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, payload }: { postId: number; payload: CreateGroupPostPayload }) =>
      groupApi.updatePost(groupId, postId, payload),
    onSuccess: (updated) => {
      toast.success('Đã cập nhật bài viết.')
      qc.invalidateQueries({ queryKey: [...groupPostKeys.all, 'list', groupId] })
      qc.invalidateQueries({ queryKey: groupPostKeys.detail(groupId, updated.id) })
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể cập nhật bài viết.'),
  })
}

/** Hook xóa bài thảo luận */
export function useDeleteGroupPostMutation(groupId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => groupApi.deletePost(groupId, postId),
    onSuccess: () => {
      toast.success('Đã xóa bài viết.')
      qc.invalidateQueries({ queryKey: [...groupPostKeys.all, 'list', groupId] })
      qc.invalidateQueries({ queryKey: [...groupPostKeys.all, 'detail', groupId] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể xóa bài viết.')
    },
  })
}

/** Hook thích / bỏ thích bài thảo luận */
export function useToggleGroupPostLikeMutation(groupId: number) {
  const qc = useQueryClient()
  const listKey = [...groupPostKeys.all, 'list', groupId]
  const patchLists = (postId: number, patch: (post: GroupPost) => GroupPost) => {
    qc.setQueriesData<InfiniteData<GroupPostPage>>({ queryKey: listKey }, (old) => old && ({
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        content: page.content.map((post) => post.id === postId ? patch(post) : post),
      })),
    }))
  }
  return useMutation({
    mutationFn: (postId: number) => groupApi.togglePostLike(groupId, postId),
    onMutate: async (postId) => {
      const detailKey = groupPostKeys.detail(groupId, postId)
      await Promise.all([
        qc.cancelQueries({ queryKey: listKey }),
        qc.cancelQueries({ queryKey: detailKey }),
      ])
      const previousLists = qc.getQueriesData<InfiniteData<GroupPostPage>>({ queryKey: listKey })
      const previousDetail = qc.getQueryData<GroupPost>(detailKey)
      const optimistic = (post: GroupPost): GroupPost => ({
        ...post,
        likedByViewer: !post.likedByViewer,
        likeCount: Math.max(0, post.likeCount + (post.likedByViewer ? -1 : 1)),
      })
      patchLists(postId, optimistic)
      qc.setQueryData<GroupPost>(detailKey, (old) => old && optimistic(old))
      return { previousLists, previousDetail }
    },
    onSuccess: (result, postId) => {
      const confirmed = (post: GroupPost): GroupPost => ({
        ...post,
        likedByViewer: result.liked,
        likeCount: result.likeCount,
      })
      patchLists(postId, confirmed)
      qc.setQueryData<GroupPost>(groupPostKeys.detail(groupId, postId), (old) => old && confirmed(old))
    },
    onError: (err: Error, postId, context) => {
      context?.previousLists.forEach(([key, data]) => qc.setQueryData(key, data))
      if (context?.previousDetail) qc.setQueryData(groupPostKeys.detail(groupId, postId), context.previousDetail)
      toast.error(err.message || 'Thao tác không thành công.')
    },
    onSettled: (_result, _error, postId) => {
      qc.invalidateQueries({ queryKey: listKey })
      qc.invalidateQueries({ queryKey: groupPostKeys.detail(groupId, postId) })
    },
  })
}

/** Hook ghim / bỏ ghim bài thảo luận */
export function useToggleGroupPostPinMutation(groupId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => groupApi.togglePostPin(groupId, postId),
    onSuccess: (data) => {
      toast.success(data.isPinned ? 'Đã ghim bài viết lên đầu nhóm' : 'Đã bỏ ghim bài viết')
      qc.invalidateQueries({ queryKey: [...groupPostKeys.all, 'list', groupId] })
      qc.invalidateQueries({ queryKey: groupPostKeys.detail(groupId, data.id) })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể thay đổi trạng thái ghim.')
    },
  })
}

/**
 * Hook lấy danh sách bình luận của bài viết.
 * @param enabled false = chưa gọi API (khung bình luận đang đóng) để tránh N+1 request khi tải danh sách bài viết
 */
export function useGroupCommentsQuery(groupId: number, postId: number, size = 50, enabled = true) {
  return useInfiniteQuery({
    queryKey: groupPostKeys.comments(groupId, postId, 0, size),
    queryFn: ({ pageParam }) => groupApi.listComments(groupId, postId, pageParam, size),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.last ? undefined : lastPage.pageNumber + 1,
    enabled: enabled && Number.isFinite(groupId) && Number.isFinite(postId) && postId > 0,
    staleTime: 1000 * 20,
  })
}

/** Hook thêm bình luận vào bài viết */
export function useCreateGroupCommentMutation(groupId: number, postId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ content, parentId }: { content: string; parentId?: number }) =>
      groupApi.createComment(groupId, postId, content, parentId),
    onSuccess: (created, variables) => {
      toast.success('Đã gửi bình luận!')
      const confirmed: GroupComment = {
        ...created,
        parentId: variables.parentId ?? created.parentId ?? null,
      }
      let patched = false
      qc.setQueriesData<InfiniteData<GroupCommentPage>>(
        { queryKey: groupPostKeys.comments(groupId, postId) },
        (old) => {
          if (!old || old.pages.some((page) => page.content.some((comment) => comment.id === confirmed.id))) return old
          patched = true
          const lastIndex = old.pages.length - 1
          return {
            ...old,
            pages: old.pages.map((page, index) => index === lastIndex ? {
              ...page,
              content: [...page.content, confirmed],
              totalElements: page.totalElements + 1,
            } : page),
          }
        },
      )
      if (!patched) qc.invalidateQueries({ queryKey: groupPostKeys.comments(groupId, postId) })
      qc.invalidateQueries({ queryKey: [...groupPostKeys.all, 'list', groupId] })
      qc.invalidateQueries({ queryKey: groupPostKeys.detail(groupId, postId) })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể gửi bình luận.')
    },
  })
}

export function useUpdateGroupCommentMutation(groupId: number, postId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      groupApi.updateComment(groupId, postId, commentId, content),
    onSuccess: () => {
      toast.success('Đã cập nhật bình luận.')
      qc.invalidateQueries({ queryKey: groupPostKeys.comments(groupId, postId) })
    },
    onError: (err: Error) => toast.error(err.message || 'Không thể cập nhật bình luận.'),
  })
}

/** Hook xóa bình luận */
export function useDeleteGroupCommentMutation(groupId: number, postId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => groupApi.deleteComment(groupId, postId, commentId),
    onSuccess: () => {
      toast.success('Đã xóa bình luận.')
      qc.invalidateQueries({ queryKey: groupPostKeys.comments(groupId, postId) })
      qc.invalidateQueries({ queryKey: [...groupPostKeys.all, 'list', groupId] })
      qc.invalidateQueries({ queryKey: groupPostKeys.detail(groupId, postId) })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể xóa bình luận.')
    },
  })
}
