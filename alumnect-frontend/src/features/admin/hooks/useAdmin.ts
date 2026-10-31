import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '../api/adminApi'

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
  author?: string
  reason?: string
  status?: string
  type?: string
  postId?: number
  riskLevel?: string
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
 * Hook lấy lịch sử thông báo hệ thống của Admin (phân trang và lọc thời gian/trạng thái)
 */
export function useAdminSystemNotifications(filters: {
  timeFilter?: string
  status?: string
  page: number
  size: number
}) {
  return useQuery({
    queryKey: ['admin', 'notifications', filters],
    queryFn: async () => {
      const response = await adminApi.getSystemNotifications(filters)
      return response.data
    },
    refetchInterval: 5000, // Tự động làm mới mỗi 5 giây
  })
}

/**
 * Hook tạo mới hoặc hẹn giờ gửi thông báo hệ thống
 */
export function useCreateSystemNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Parameters<typeof adminApi.createSystemNotification>[0]) => {
      const response = await adminApi.createSystemNotification(payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Hook hủy thông báo hệ thống đã lên lịch
 */
export function useCancelSystemNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await adminApi.cancelScheduledNotification(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
    },
  })
}

/**
 * Hook lưu trữ thông báo hệ thống vào kho lưu trữ (Archive)
 */
export function useArchiveSystemNotification() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await adminApi.archiveNotification(id)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/**
 * Hook lấy danh sách toàn bộ các gói dịch vụ Mentor từ CSDL PostgreSQL dành cho Admin (UC95)
 */
export function useAdminMentorPackages() {
  return useQuery({
    queryKey: ['admin', 'mentor-packages'],
    queryFn: async () => {
      const response = await adminApi.getMentorPackages()
      return response.data
    },
  })
}

/**
 * Hook cập nhật giá và trạng thái gói dịch vụ Mentor vào CSDL PostgreSQL (UC95)
 */
export function useUpdateMentorPackage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number
      payload: import('../api/adminApi').UpdateAdminMentorPackagePayload
    }) => {
      const response = await adminApi.updateMentorPackage(id, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentor-packages'] })
      queryClient.invalidateQueries({ queryKey: ['mentorship', 'packages'] })
    },
  })
}

/**
 * Hook lấy danh sách phân trang các Mentor cho Quản trị viên hỗ trợ lọc đa tiêu chí (UC96, UC115)
 */
export function useAdminMentors(params: {
  keyword?: string
  status?: string
  subscriptionStatus?: string
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: ['admin', 'mentors', params],
    queryFn: async () => {
      const response = await adminApi.getAdminMentors(params)
      return response.data
    },
  })
}

/**
 * Hook lấy thông tin chi tiết hồ sơ quản lý của Mentor (UC115 Bước 35)
 */
export function useAdminMentorDetail(mentorId: number | null) {
  return useQuery({
    queryKey: ['admin', 'mentor-detail', mentorId],
    queryFn: async () => {
      if (!mentorId) return null
      const response = await adminApi.getAdminMentorDetail(mentorId)
      return response.data
    },
    enabled: !!mentorId,
  })
}

/**
 * Hook lấy chi tiết CV và thông tin chuyên môn của Mentor (UC96)
 */
export function useAdminMentorCv(mentorId: number | null) {
  return useQuery({
    queryKey: ['admin', 'mentor-cv', mentorId],
    queryFn: async () => {
      if (!mentorId) return null
      const response = await adminApi.getMentorCv(mentorId)
      return response.data
    },
    enabled: !!mentorId,
  })
}

/**
 * Hook lấy danh sách Ticket tranh chấp & hòa giải cho Quản trị viên (UC116)
 */
export function useAdminTickets(params: {
  keyword?: string
  type?: string
  status?: string
  handledById?: number
  page?: number
  size?: number
}) {
  return useQuery({
    queryKey: ['admin', 'mentoring-tickets', params],
    queryFn: async () => {
      const response = await adminApi.getAdminTickets(params)
      return response.data
    },
  })
}

/**
 * Hook xem chi tiết Ticket cho Quản trị viên (UC116, UC118)
 */
export function useAdminTicketDetail(ticketId: number | null) {
  return useQuery({
    queryKey: ['admin', 'mentoring-ticket-detail', ticketId],
    queryFn: async () => {
      if (!ticketId) return null
      const response = await adminApi.getAdminTicketDetail(ticketId)
      return response.data
    },
    enabled: !!ticketId,
  })
}

/**
 * Hook Quản trị viên tiếp nhận xử lý Ticket tranh chấp / hòa giải (UC117)
 */
export function useAcceptAdminTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ticketId: number) => {
      const response = await adminApi.acceptAdminTicket(ticketId)
      return response.data
    },
    onSuccess: (_, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentoring-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentoring-ticket-detail', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentoring-ticket-context', ticketId] })
    },
  })
}

/**
 * Hook lấy toàn bộ bằng chứng tranh chấp và bối cảnh toàn diện Task cho Admin (UC118)
 */
export function useAdminDisputeContext(ticketId: number | null) {
  return useQuery({
    queryKey: ['admin', 'mentoring-ticket-context', ticketId],
    queryFn: async () => {
      if (!ticketId) return null
      const response = await adminApi.getAdminDisputeContext(ticketId)
      return response.data
    },
    enabled: !!ticketId,
  })
}

/**
 * Hook lấy danh sách tin nhắn trao đổi trong Ticket cho Admin (UC119)
 */
export function useAdminTicketMessages(ticketId: number | null) {
  return useQuery({
    queryKey: ['admin', 'mentoring-ticket-messages', ticketId],
    queryFn: async () => {
      if (!ticketId) return []
      const response = await adminApi.getAdminTicketMessages(ticketId)
      return response.data
    },
    enabled: !!ticketId,
    refetchInterval: 4000, // Polling định kỳ 4s làm mới tin nhắn mới
  })
}

/**
 * Hook Admin gửi tin nhắn / hướng dẫn hòa giải / yêu cầu bổ sung thông tin (UC119)
 */
export function useSendAdminTicketMessage(ticketId: number | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Parameters<typeof adminApi.sendAdminTicketMessage>[1]) => {
      if (!ticketId) throw new Error('Ticket ID không hợp lệ')
      const response = await adminApi.sendAdminTicketMessage(ticketId, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentoring-ticket-messages', ticketId] })
    },
  })
}

/**
 * Hook Quản trị viên ra phán quyết quyết định phương án giải quyết Ticket (UC120)
 */
export function useResolveAdminTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, payload }: { ticketId: number; payload: Parameters<typeof adminApi.resolveAdminTicket>[1] }) => {
      const response = await adminApi.resolveAdminTicket(ticketId, payload)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentoring-tickets'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentoring-ticket-detail', variables.ticketId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentoring-ticket-context', variables.ticketId] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentoring-ticket-messages', variables.ticketId] })
    },
  })
}

/**
 * Hook Admin xem danh sách Quỹ và dòng tiền theo Task (UC121)
 */
export function useAdminTaskFunds(filters: {
  keyword?: string
  status?: string
  settlementStatus?: string
  page: number
  size: number
}) {
  return useQuery({
    queryKey: ['admin', 'mentoring-finances-tasks', filters],
    queryFn: async () => {
      const response = await adminApi.getAdminTaskFunds(filters)
      return response.data
    },
    refetchInterval: 10000, // Tự động cập nhật số liệu quỹ định kỳ 10s
  })
}

/**
 * Hook Admin xem chi tiết Sổ quỹ và toàn bộ lịch sử tài chính của Task (UC121)
 */
export function useAdminTaskFundDetail(taskId: number | null) {
  return useQuery({
    queryKey: ['admin', 'mentoring-task-fund-detail', taskId],
    queryFn: async () => {
      if (!taskId) return null
      const response = await adminApi.getAdminTaskFundDetail(taskId)
      return response.data
    },
    enabled: !!taskId,
  })
}

/**
 * Hook chi lại thù lao Mentor cho lệnh chi PayOS đã thất bại
 */
export function useRetryAdminPayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ledgerId, note }: { ledgerId: number; note?: string }) => {
      const response = await adminApi.retryAdminPayout(ledgerId, note)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentoring-task-fund-detail'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'mentoring-finances-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'payout-balance'] })
    },
  })
}

/**
 * Hook lấy số dư tài khoản Kênh chi PayOS
 */
export function useAdminPayoutBalance() {
  return useQuery({
    queryKey: ['admin', 'payout-balance'],
    queryFn: async () => {
      const response = await adminApi.getAdminPayoutBalance()
      return response.data
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  })
}

export function useAdminRevenueOverview(filters?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['admin', 'revenue', filters],
    queryFn: async () => {
      const response = await adminApi.getRevenueOverview(filters)
      return response.data
    },
    staleTime: 30 * 1000,
  })
}
