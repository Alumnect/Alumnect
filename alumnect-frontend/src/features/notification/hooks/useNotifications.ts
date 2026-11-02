import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '../api/notificationApi'
import { useAuthStore } from '@/store/authStore'

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (page: number, size: number) => ['notifications', 'list', page, size] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
}

/**
 * Hook truy vấn danh sách thông báo phân trang.
 */
export function useNotifications(page = 0, size = 20) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(page, size),
    queryFn: async () => {
      const res = await notificationApi.getNotifications(page, size)
      return res.data
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

/**
 * Hook truy vấn số lượng thông báo chưa đọc.
 */
export function useUnreadNotificationCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount,
    queryFn: async () => {
      const res = await notificationApi.getUnreadCount()
      return res.data?.unreadCount || 0
    },
    enabled: isAuthenticated,
    staleTime: 15_000,
  })
}

/**
 * Hook đánh dấu một thông báo là đã đọc (có optimistic update).
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      // Làm mới danh sách và số lượng chưa đọc
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}

/**
 * Hook đánh dấu tất cả thông báo là đã đọc.
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}
