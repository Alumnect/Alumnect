import { useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui'
import type { AdminQuestionReportDto } from '../api/adminApi'

/**
 * Custom hook lắng nghe sự kiện phát sóng báo cáo câu hỏi vi phạm real-time qua WebSocket STOMP (UC78).
 * Khi bên người dùng gửi báo cáo câu hỏi vi phạm mới, Admin dashboard tự động cập nhật danh sách và hiển thị thông báo.
 */
export function useWebSocketViolatingQuestions() {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!accessToken) return

    // Cấu hình WebSocket URL dựa trên VITE_API_BASE_URL
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
        setIsConnected(true)
        // Lắng nghe kênh broadcast báo cáo câu hỏi vi phạm công khai dành cho Admin
        client.subscribe('/topic/admin/reports/questions', (stompMessage) => {
          try {
            const newReport: AdminQuestionReportDto = JSON.parse(stompMessage.body)

            // Hiển thị thông báo Toast real-time cho Admin
            toast.info(`⚠️ Nhận báo cáo câu hỏi vi phạm mới: "${newReport.questionTitle?.slice(0, 30)}..."`)

            // Tự động làm mới cache React Query của danh sách báo cáo câu hỏi vi phạm
            queryClient.invalidateQueries({ queryKey: ['admin-question-reports'] })
          } catch (e) {
            console.error('Lỗi phân giải tin nhắn WebSocket báo cáo câu hỏi:', e)
          }
        })
      },
      onDisconnect: () => {
        setIsConnected(false)
      },
      beforeConnect: () => {
        const latestToken = useAuthStore.getState().accessToken
        if (latestToken) {
          client.connectHeaders = {
            Authorization: `Bearer ${latestToken}`,
          }
        }
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
      setIsConnected(false)
    }
  }, [accessToken, queryClient])

  return { isConnected }
}
