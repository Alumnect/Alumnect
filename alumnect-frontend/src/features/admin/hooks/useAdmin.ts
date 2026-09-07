import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Client } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/components/ui'
import {
  adminApi,
  type GetQuestionReportsParams,
  type UpdateQuestionReportStatusPayload,
  type GetAnswerReportsParams,
  type UpdateAnswerReportStatusPayload,
  type AdminQuestionReportDto,
  type AdminAnswerReportDto,
} from '../api/adminApi'

/**
 * Hook lấy dữ liệu dashboard KPIs và thống kê đăng ký
 */
export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: async () => {
      const response = await adminApi.getDashboardSummary()
      return response.data
    },
    staleTime: 1000 * 30, // 30s cache
  })
}

/**
 * Hook lấy danh sách tài khoản theo bộ lọc và phân trang
 */
export function useAdminUsers(filters: {
  query?: string
  role?: string
  status?: string
  majorId?: number | string
  cohort?: number | string
  page: number
  size: number
}) {
  return useQuery({
    queryKey: ['admin', 'users', filters],
    queryFn: async () => {
      const response = await adminApi.getUsers(filters)
      return response.data
    },
    refetchInterval: 5000, // Poll every 5s for real-time list updates
  })
}

/**
 * Hook lấy chi tiết một tài khoản người dùng
 */
export function useAdminUserDetail(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: async () => {
      if (!id) return null
      const response = await adminApi.getUserDetail(id)
      return response.data
    },
    enabled: id !== null,
    refetchInterval: 3000, // Poll every 3s when the user details modal is open
  })
}

/**
 * Hook cập nhật trạng thái tài khoản (Khóa/Mở khóa)
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'ACTIVE' | 'LOCKED' }) => {
      const response = await adminApi.updateUserStatus(id, status)
      return response.data
    },
    onSuccess: (_, variables) => {
      // Refresh danh sách người dùng và chi tiết người dùng
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
  })
}

/**
 * Hook lấy danh sách yêu cầu xác thực cựu sinh viên
 */
export function useAdminVerifications(params: {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  page: number
  size: number
}) {
  return useQuery({
    queryKey: ['admin', 'verifications', params],
    queryFn: async () => {
      const response = await adminApi.getVerificationRequests(params)
      return response.data
    },
  })
}

/**
 * Hook phê duyệt hoặc từ chối yêu cầu xác thực tốt nghiệp
 */
export function useReviewVerification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reviewNote,
    }: {
      id: number
      status: 'APPROVED' | 'REJECTED'
      reviewNote?: string
    }) => {
      const response = await adminApi.reviewVerificationRequest(id, { status, reviewNote })
      return response.data
    },
    onSuccess: () => {
      // Refresh các danh sách liên quan và thống kê
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

/**
 * Hook lấy danh sách toàn bộ bài viết phân trang và lọc động (UC65 & UC66)
 */
export function useAdminPosts(filters: {
  query?: string
  author?: string
  status?: string
  type?: string
  page: number
  size: number
}) {
  return useQuery({
    queryKey: ['admin', 'posts', filters],
    queryFn: async () => {
      const response = await adminApi.getPosts(filters)
      return response.data
    },
  })
}

/**
 * Hook thay đổi trạng thái ẩn/hiện của bài viết (UC68)
 */
export function useTogglePostHidden() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, hidden }: { id: number; hidden: boolean }) => {
      const response = await adminApi.togglePostHidden(id, hidden)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'post', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
  })
}

/**
 * Hook lấy chi tiết một bài viết cộng đồng dành cho Admin (UC67)
 */
export function useAdminPostDetail(id: number | null) {
  return useQuery({
    queryKey: ['admin', 'post', id],
    queryFn: async () => {
      if (!id) return null
      const response = await adminApi.getPostDetail(id)
      return response.data
    },
    enabled: id !== null,
  })
}

/**
 * Hook lấy danh sách báo cáo vi phạm bài viết với bộ lọc động và phân trang (UC69)
 */
export function useAdminReports(filters: {
  query?: string
  reason?: string
  status?: string
  postId?: number
  page: number
  size: number
}) {
  return useQuery({
    queryKey: ['admin', 'reports', filters],
    queryFn: async () => {
      const response = await adminApi.getReports(filters)
      return response.data
    },
  })
}

/**
 * Hook cập nhật trạng thái xử lý của một báo cáo vi phạm bài viết (UC69)
 */
export function useUpdateReportStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'RESOLVED' | 'DISMISSED' }) => {
      const response = await adminApi.updateReportStatus(id, status)
      return response.data
    },
    onSuccess: () => {
      // Refresh danh sách báo cáo và các thống kê liên quan
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
  })
}

/**
 * Hook lấy danh sách báo cáo câu hỏi vi phạm cho Admin với React Query (UC78).
 */
export function useAdminQuestionReports(params: GetQuestionReportsParams) {
  return useQuery({
    queryKey: ['admin-question-reports', params],
    queryFn: async () => {
      const res = await adminApi.getQuestionReports(params)
      return res.data
    },
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook cập nhật trạng thái xử lý báo cáo câu hỏi vi phạm (RESOLVED / DISMISSED) (UC78).
 */
export function useUpdateQuestionReportStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateQuestionReportStatusPayload) => adminApi.updateQuestionReportStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-question-reports'] })
      toast.success('Đã cập nhật trạng thái xử lý báo cáo câu hỏi thành công!')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái báo cáo câu hỏi')
    },
  })
}

/**
 * Hook lấy danh sách báo cáo câu trả lời vi phạm cho Admin với React Query (UC79).
 */
export function useAdminAnswerReports(params: GetAnswerReportsParams) {
  return useQuery({
    queryKey: ['admin-answer-reports', params],
    queryFn: async () => {
      const res = await adminApi.getAnswerReports(params)
      return res.data
    },
    placeholderData: (previousData) => previousData,
  })
}

/**
 * Hook cập nhật trạng thái xử lý báo cáo câu trả lời vi phạm (RESOLVED / DISMISSED) (UC79).
 */
export function useUpdateAnswerReportStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateAnswerReportStatusPayload) => adminApi.updateAnswerReportStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-answer-reports'] })
      toast.success('Đã cập nhật trạng thái xử lý báo cáo câu trả lời thành công!')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái báo cáo câu trả lời')
    },
  })
}

/**
 * Custom hook lắng nghe sự kiện phát sóng báo cáo câu hỏi vi phạm real-time qua WebSocket STOMP (UC78).
 */
export function useWebSocketViolatingQuestions() {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)

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
        setIsConnected(true)
        client.subscribe('/topic/admin/reports/questions', (stompMessage) => {
          try {
            const newReport: AdminQuestionReportDto = JSON.parse(stompMessage.body)
            toast.info(`⚠️ Nhận báo cáo câu hỏi vi phạm mới: "${newReport.questionTitle?.slice(0, 30)}..."`)
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

/**
 * Custom hook lắng nghe sự kiện phát sóng báo cáo câu trả lời vi phạm real-time qua WebSocket STOMP (UC79).
 */
export function useWebSocketViolatingAnswers() {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const clientRef = useRef<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)

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
        setIsConnected(true)
        client.subscribe('/topic/admin/reports/answers', (stompMessage) => {
          try {
            const newReport: AdminAnswerReportDto = JSON.parse(stompMessage.body)
            toast.info(`⚠️ Nhận báo cáo câu trả lời vi phạm mới từ ${newReport.reporterName || 'Người dùng'}`)
            queryClient.invalidateQueries({ queryKey: ['admin-answer-reports'] })
          } catch (e) {
            console.error('Lỗi phân giải tin nhắn WebSocket báo cáo câu trả lời:', e)
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
