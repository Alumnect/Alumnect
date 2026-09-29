import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui'
import { groupApi } from '../api/groupApi'
import type { CreateGroupPostPayload } from '../model/group'

export const groupPostKeys = {
  all: ['group-posts'] as const,
  list: (groupId: number, size = 10) => [...groupPostKeys.all, 'list', groupId, size] as const,
  detail: (groupId: number, postId: number) => [...groupPostKeys.all, 'detail', groupId, postId] as const,
  comments: (groupId: number, postId: number, page = 0) => [...groupPostKeys.all, 'comments', groupId, postId, page] as const,
}

/**
 * Hook lấy danh sách bài viết / thảo luận trong nhóm theo phân trang vô hạn:
 * mỗi lần `fetchNextPage` sẽ nối thêm trang kế tiếp vào cuối danh sách (không thay thế các trang đã tải).
 * @param groupId ID hội nhóm
 * @param size Số bài viết mỗi trang
 */
export function useGroupPostsInfinite(groupId: number, size = 10) {
  return useInfiniteQuery({
    queryKey: groupPostKeys.list(groupId, size),
    queryFn: ({ pageParam }) => groupApi.listPosts(groupId, pageParam, size),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.last ? undefined : lastPage.pageNumber + 1),
    enabled: Number.isFinite(groupId) && groupId > 0,
    staleTime: 1000 * 30, // 30s
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
    onError: (err: any) => {
      toast.error(err?.message || 'Không thể đăng bài thảo luận. Vui lòng thử lại.')
    },
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
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Không thể xóa bài viết.')
    },
  })
}

/** Hook thích / bỏ thích bài thảo luận */
export function useToggleGroupPostLikeMutation(groupId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (postId: number) => groupApi.togglePostLike(groupId, postId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...groupPostKeys.all, 'list', groupId] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Thao tác không thành công.')
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
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Không thể thay đổi trạng thái ghim.')
    },
  })
}

/**
 * Hook lấy danh sách bình luận của bài viết.
 * @param enabled false = chưa gọi API (khung bình luận đang đóng) để tránh N+1 request khi tải danh sách bài viết
 */
export function useGroupCommentsQuery(groupId: number, postId: number, page = 0, size = 20, enabled = true) {
  return useQuery({
    queryKey: groupPostKeys.comments(groupId, postId, page),
    queryFn: () => groupApi.listComments(groupId, postId, page, size),
    enabled: enabled && Number.isFinite(groupId) && Number.isFinite(postId) && postId > 0,
    staleTime: 1000 * 20,
  })
}

/** Hook thêm bình luận vào bài viết */
export function useCreateGroupCommentMutation(groupId: number, postId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => groupApi.createComment(groupId, postId, content),
    onSuccess: () => {
      toast.success('Đã gửi bình luận!')
      qc.invalidateQueries({ queryKey: groupPostKeys.comments(groupId, postId) })
      qc.invalidateQueries({ queryKey: [...groupPostKeys.all, 'list', groupId] })
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Không thể gửi bình luận.')
    },
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
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Không thể xóa bình luận.')
    },
  })
}
