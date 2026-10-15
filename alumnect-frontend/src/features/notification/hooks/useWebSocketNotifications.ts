import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { NOTIFICATION_KEYS } from './useNotifications'

/**
 * Hook lắng nghe WebSocket STOMP kênh `/user/queue/notifications` để nhận thông báo thời gian thực.
 * Cập nhật badge và danh sách trong Notification Center mà không tạo popup nổi.
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
            JSON.parse(stompMessage.body)

            // Cập nhật số chưa đọc trên chuông.
            queryClient.setQueryData<number>(NOTIFICATION_KEYS.unreadCount, (old) => (old ? old + 1 : 1))

            // Nội dung mới chỉ hiển thị trong Notification Center.
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
