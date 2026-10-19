import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { NOTIFICATION_KEYS } from './useNotifications'
import type { NotificationItem } from '../model/types'
import { mentoringRequestApi } from '@/features/mentorship/api/mentoringRequestApi'
import { toast } from '@/components/ui'
import { notificationApi } from '../api/notificationApi'

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
            const notification = JSON.parse(stompMessage.body) as NotificationItem

            // Cập nhật số chưa đọc trên chuông.
            queryClient.setQueryData<number>(NOTIFICATION_KEYS.unreadCount, (old) => (old ? old + 1 : 1))

            // Nội dung mới chỉ hiển thị trong Notification Center.
            queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })

            // Mọi sự kiện mentoring đều làm mới các màn hình liên quan ngay khi bên kia thao tác.
            if (notification.type.startsWith('MENTORING_')) {
              queryClient.invalidateQueries({
                predicate: (query) => {
                  const rootKey = query.queryKey[0]
                  return typeof rootKey === 'string' && rootKey.startsWith('mentoring')
                },
              })
            }

            if (notification.targetType === 'MENTORING_INCOMING_REQUEST' && notification.targetId) {
              const requestId = Number(notification.targetId)
              if (Number.isInteger(requestId) && requestId > 0) {
                const respond = async (accepted: boolean) => {
                  try {
                    if (accepted) {
                      await mentoringRequestApi.acceptIncomingRequest(requestId)
                      toast.success('Đã nhận yêu cầu Mentoring. Kênh trao đổi đã được mở.')
                    } else {
                      await mentoringRequestApi.declineIncomingRequest(requestId)
                      toast.success('Đã bỏ qua yêu cầu Mentoring.')
                    }
                    await notificationApi.markAsRead(notification.id)
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : 'Không thể xử lý yêu cầu Mentoring')
                  } finally {
                    queryClient.invalidateQueries({
                      predicate: (query) => {
                        const rootKey = query.queryKey[0]
                        return typeof rootKey === 'string' && rootKey.startsWith('mentoring')
                      },
                    })
                    queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
                  }
                }

                toast.notification(
                  notification.content || 'Bạn vừa nhận được một yêu cầu Mentoring mới.',
                  12_000,
                  [
                    { label: 'Nhận', onClick: () => respond(true) },
                    { label: 'Bỏ qua', variant: 'secondary', onClick: () => respond(false) },
                  ],
                )
              }
            }
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
