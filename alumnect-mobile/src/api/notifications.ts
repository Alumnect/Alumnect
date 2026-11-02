import { useQuery } from '@tanstack/react-query'
import http from '@/lib/http'
import type { ApiResponse, PageResponse } from '@/lib/http'

export interface NotificationItem {
  id: number
  type: string
  title?: string | null
  content: string
  targetType?: string | null
  targetId?: string | null
  senderCount: number
  isRead: boolean
  createdAt: string
  senderId?: number | null
  senderName?: string | null
  senderAvatarUrl?: string | null
}

export const notificationApi = {
  list: (page = 0, size = 20) =>
    http.get<unknown, ApiResponse<PageResponse<NotificationItem>>>('/notifications', { params: { page, size } }),
  unreadCount: () => http.get<unknown, ApiResponse<{ unreadCount: number }>>('/notifications/unread-count'),
  markRead: (id: number) => http.patch<unknown, ApiResponse<void>>(`/notifications/${id}/read`),
  markAllRead: () => http.patch<unknown, ApiResponse<void>>('/notifications/read-all'),
}

export function useUnreadCount(): number {
  const q = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationApi.unreadCount,
    refetchInterval: 60_000,
  })
  return q.data?.data?.unreadCount ?? 0
}
