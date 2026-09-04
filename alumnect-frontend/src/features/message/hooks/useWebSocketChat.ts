import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import type { Message } from '../model/types'

/**
 * Hook kết nối WebSocket STOMP nhận tin nhắn thời gian thực và tự động làm mới cache React Query.
 */
export function useWebSocketChat(onMessageReceived?: (message: Message) => void) {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const clientRef = useRef<Client | null>(null)

  useEffect(() => {
    if (!accessToken) return

    // Suy biến WebSocket URL từ baseURL cấu hình
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
    let wsUrl = apiBase.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '') + '/ws'

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        // Lắng nghe kênh tin nhắn cá nhân của người dùng hiện tại
        client.subscribe('/user/queue/messages', (stompMessage) => {
          try {
            const newMsg: Message = JSON.parse(stompMessage.body)
            // Tự động làm mới danh sách hội thoại và danh sách tin nhắn
            queryClient.invalidateQueries({ queryKey: ['conversations'] })
            queryClient.invalidateQueries({ queryKey: ['messages', newMsg.conversationId] })

            if (onMessageReceived) {
              onMessageReceived(newMsg)
            }
          } catch (e) {
            console.error('Lỗi phân giải tin nhắn WebSocket:', e)
          }
        })
      },
      onStompError: (frame) => {
        console.warn('STOMP Error:', frame.headers['message'])
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
    }
  }, [accessToken, queryClient, onMessageReceived])

  return clientRef.current
}
