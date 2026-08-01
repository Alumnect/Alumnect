import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../api/userApi'
import type { ChangePasswordPayload } from '../model/userTypes'

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => userApi.changePassword(payload),
  })
}

export function useFollowUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => userApi.followUser(userId),

    // [H-05] Optimistic Update — cập nhật UI ngay lập tức trước khi API trả về
    onMutate: async (userId) => {
      // Hủy mọi query đang refetch để tránh race condition
      await queryClient.cancelQueries({ queryKey: ['user-profile', userId] })

      // Lưu snapshot trạng thái hiện tại để rollback nếu lỗi
      const previousProfile = queryClient.getQueryData(['user-profile', userId])

      // Optimistically cập nhật profile ngay
      queryClient.setQueryData(['user-profile', userId], (old: any) =>
        old ? { ...old, isFollowing: true, followersCount: (old.followersCount || 0) + 1 } : old
      )

      return { previousProfile }
    },

    onError: (_err, userId, context) => {
      // Rollback nếu API thất bại
      if (context?.previousProfile) {
        queryClient.setQueryData(['user-profile', userId], context.previousProfile)
      }
    },

    onSuccess: (_, userId) => {
      // [C-01] Chỉ invalidate đúng userId
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] })
      queryClient.invalidateQueries({ queryKey: ['user-profile', 'own'] })

      // [I-02] Cập nhật trực tiếp isFollowing của user được follow trong mọi danh sách followers/following đang mở
      queryClient.setQueriesData({ queryKey: ['user-followers'] }, (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((item: any) =>
              String(item.userId) === String(userId)
                ? { ...item, isFollowing: true }
                : item
            ),
          })),
        }
      })

      queryClient.setQueriesData({ queryKey: ['user-following'] }, (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((item: any) =>
              String(item.userId) === String(userId)
                ? { ...item, isFollowing: true }
                : item
            ),
          })),
        }
      })

      // Invalidate danh sách followers/following của target user & viewer
      queryClient.invalidateQueries({ queryKey: ['user-followers', userId] })
      const ownProfile = queryClient.getQueryData(['user-profile', 'own']) as any
      if (ownProfile?.userId) {
        queryClient.invalidateQueries({ queryKey: ['user-following', ownProfile.userId] })
      }
    },
  })
}

export function useUnfollowUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => userApi.unfollowUser(userId),

    // [H-05] Optimistic Update — cập nhật UI ngay lập tức
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ['user-profile', userId] })

      const previousProfile = queryClient.getQueryData(['user-profile', userId])

      queryClient.setQueryData(['user-profile', userId], (old: any) =>
        old ? { ...old, isFollowing: false, followersCount: Math.max(0, (old.followersCount || 0) - 1) } : old
      )

      return { previousProfile }
    },

    onError: (_err, userId, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['user-profile', userId], context.previousProfile)
      }
    },

    onSuccess: (_, userId) => {
      // [C-01] Chỉ invalidate đúng userId
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] })
      queryClient.invalidateQueries({ queryKey: ['user-profile', 'own'] })

      // [I-02] Cập nhật trực tiếp isFollowing của user bị hủy follow trong mọi danh sách followers/following đang mở
      queryClient.setQueriesData({ queryKey: ['user-followers'] }, (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((item: any) =>
              String(item.userId) === String(userId)
                ? { ...item, isFollowing: false }
                : item
            ),
          })),
        }
      })

      queryClient.setQueriesData({ queryKey: ['user-following'] }, (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((item: any) =>
              String(item.userId) === String(userId)
                ? { ...item, isFollowing: false }
                : item
            ),
          })),
        }
      })

      // Invalidate danh sách followers/following của target user & viewer
      queryClient.invalidateQueries({ queryKey: ['user-followers', userId] })
      const ownProfile = queryClient.getQueryData(['user-profile', 'own']) as any
      if (ownProfile?.userId) {
        queryClient.invalidateQueries({ queryKey: ['user-following', ownProfile.userId] })
      }
    },
  })
}
