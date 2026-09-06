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
  const onMessageReceivedRef = useRef(onMessageReceived)
  onMessageReceivedRef.current = onMessageReceived

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

            // 1. Cập nhật trực tiếp cache tin nhắn vào useInfiniteQuery mà không cần gọi HTTP
            queryClient.setQueryData<{ pages: any[]; pageParams: any[] }>(
              ['messages', newMsg.conversationId],
              (oldData) => {
                if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                  return oldData
                }
                // Tránh chèn trùng tin nhắn
                const exists = oldData.pages.some((page) =>
                  page.content?.some((m: Message) => m.id === newMsg.id)
                )
                if (exists) return oldData

                const firstPage = oldData.pages[0]
                const updatedFirstPage = {
                  ...firstPage,
                  content: [newMsg, ...(firstPage.content || [])],
                  totalElements: (firstPage.totalElements || 0) + 1,
                }

                return {
                  ...oldData,
                  pages: [updatedFirstPage, ...oldData.pages.slice(1)],
                }
              }
            )

            // 2. Cập nhật trực tiếp danh sách cuộc hội thoại (snippet, lastMessageAt, unreadCount)
            let isExistingConv = false
            queryClient.setQueryData<any[]>(['conversations'], (oldConvs) => {
              if (!oldConvs || !Array.isArray(oldConvs)) return oldConvs

              const snippet = newMsg.content?.trim()
                ? newMsg.content
                : newMsg.attachments?.[0]?.mediaType === 'IMAGE'
                ? '[Hình ảnh]'
                : newMsg.attachments?.[0]?.mediaType === 'VIDEO'
                ? '[Video]'
                : '[Tệp đính kèm]'

              const updated = oldConvs.map((conv) => {
                if (conv.id === newMsg.conversationId) {
                  isExistingConv = true
                  return {
                    ...conv,
                    lastMessage: snippet,
                    lastMessageAt: newMsg.createdAt,
                    unreadCount: (conv.unreadCount || 0) + 1,
                  }
                }
                return conv
              })

              if (isExistingConv) {
                // Đưa cuộc trò chuyện có tin nhắn mới nhất lên đầu danh sách
                return updated.sort((a, b) => {
                  const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
                  const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
                  return timeB - timeA
                })
              }
              return updated
            })

            // Nếu là hội thoại hoàn toàn mới chưa có trong danh sách thì mới nạp lại
            if (!isExistingConv) {
              queryClient.invalidateQueries({ queryKey: ['conversations'] })
            }


            if (onMessageReceivedRef.current) {
              onMessageReceivedRef.current(newMsg)
            }
          } catch (e) {
            console.error('Lỗi phân giải tin nhắn WebSocket:', e)
          }
        })
      },
      beforeConnect: () => {
        const latestToken = useAuthStore.getState().accessToken
        if (latestToken) {
          client.connectHeaders = {
            Authorization: `Bearer ${latestToken}`,
          }
        }
      },
      onStompError: (frame) => {
        const errMsg = frame.headers['message'] || ''
        console.warn('STOMP Connection Error:', errMsg, frame.body)
        if (errMsg.includes('JWT') || errMsg.includes('hết hạn') || errMsg.includes('xác thực')) {
          // Khi server báo lỗi token hết hạn/lỗi, ngừng reconnect với token hỏng
          client.deactivate()
        }
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
    }
  }, [accessToken, queryClient])

  return clientRef.current
}
