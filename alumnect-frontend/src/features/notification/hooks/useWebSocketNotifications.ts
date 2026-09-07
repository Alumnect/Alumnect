import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/Toast'
import type { NotificationItem } from '../model/types'
import { NOTIFICATION_KEYS } from './useNotifications'

/**
 * Hook lắng nghe WebSocket STOMP kênh `/user/queue/notifications` để nhận thông báo thời gian thực.
 * Tự động kích hoạt thông báo Toast nổi và làm mới cache số lượng chưa đọc / danh sách thông báo.
 */
export function useWebSocketNotifications() {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!accessToken) return

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
    const wsUrl = apiBase.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '') + '/ws'

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Lắng nghe kênh thông báo cá nhân
        client.subscribe('/user/queue/notifications', (stompMessage) => {
          try {
            const notif: NotificationItem = JSON.parse(stompMessage.body)

            // 1. Hiển thị Toast nổi thông báo ngay trên màn hình (màu xanh lá tươi sáng với icon Bell)
            toast.notification(notif.content)

            // 2. Cập nhật tăng số đếm chưa đọc trong cache
            queryClient.setQueryData<number>(NOTIFICATION_KEYS.unreadCount, (old) => (old ? old + 1 : 1))

            // 3. Làm mới toàn bộ cache thông báo để cập nhật trang Notifications
            queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
          } catch (err) {
            console.error('Lỗi phân tích cú pháp thông báo WebSocket:', err)
          }
        })
      },
      onStompError: (frame) => {
        console.error('Lỗi STOMP Notifications:', frame.headers['message'])
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate()
      }
    }
  }, [accessToken, queryClient])
}
