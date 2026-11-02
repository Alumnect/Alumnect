import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mentoringTaskApi } from '../api/mentoringTaskApi'
import { DEAL_QUERY_KEYS } from './useMentoringDeals'
import { MENTORING_CONVERSATION_QUERY_KEYS } from './useMentoringConversation'
import type { PageResponse } from '../model/mentoringDealTypes'
import type {
  ConfirmWorkLogPayload,
  CreateTaskPaymentRequest,
  CreateWorkLogPayload,
  MentoringTask,
  MentoringTaskDetail,
  MentoringTaskPaymentCheckoutResponse,
  MentoringTaskPaymentStatusResponse,
  MentoringTaskStatus,
  MentoringWorkLog,
  RejectWorkLogPayload,
  UpdateWorkLogPayload,
  MentoringTaskReport,
} from '../model/mentoringTaskTypes'

export const TASK_QUERY_KEYS = {
  all: ['mentoringTasks'] as const,
  lists: () => [...TASK_QUERY_KEYS.all, 'list'] as const,
  list: (stage?: string, status?: MentoringTaskStatus, page = 0, size = 10) =>
    [...TASK_QUERY_KEYS.lists(), { stage, status, page, size }] as const,
  details: () => [...TASK_QUERY_KEYS.all, 'detail'] as const,
  detail: (id?: number) => [...TASK_QUERY_KEYS.details(), id] as const,
  workLogs: (taskId?: number) => [...TASK_QUERY_KEYS.all, 'workLogs', taskId] as const,
  payments: () => [...TASK_QUERY_KEYS.all, 'payment'] as const,
  paymentStatus: (orderCode?: number) =>
    [...TASK_QUERY_KEYS.payments(), orderCode] as const,
  checkoutSession: (dealId?: number, amendmentId?: number) =>
    [...TASK_QUERY_KEYS.payments(), 'checkout', dealId, amendmentId ?? null] as const,
  report: (id?: number) => [...TASK_QUERY_KEYS.all, 'report', id] as const,
}

/**
 * Hook truy vấn danh sách Mentoring Tasks của người dùng hiện tại (UC105 & UC106).
 */
export function useMyTasks(
  stage?: string,
  status?: MentoringTaskStatus,
  page = 0,
  size = 10
) {
  return useQuery<PageResponse<MentoringTask>, Error>({
    queryKey: TASK_QUERY_KEYS.list(stage, status, page, size),
    queryFn: () => mentoringTaskApi.getMyTasks({ stage, status, page, size }),
  })
}

/**
 * Hook truy vấn chi tiết toàn diện một Mentoring Task theo ID (UC106).
 */
export function useTaskDetail(taskId?: number) {
  const hasTask = typeof taskId === 'number' && taskId > 0
  return useQuery<MentoringTaskDetail | null, Error>({
    queryKey: TASK_QUERY_KEYS.detail(taskId),
    // refetch() bỏ qua `enabled`, nên chặn tại queryFn: chưa có task thì không gọi API
    queryFn: () => (hasTask ? mentoringTaskApi.getTaskDetail(taskId) : Promise.resolve(null)),
    enabled: hasTask,
  })
}

/**
 * Hook truy vấn danh sách Work Logs của Task (UC106 & UC107).
 */
export function useTaskWorkLogs(taskId?: number) {
  return useQuery<MentoringWorkLog[], Error>({
    queryKey: TASK_QUERY_KEYS.workLogs(taskId),
    queryFn: () => mentoringTaskApi.getWorkLogs(taskId!),
    enabled: typeof taskId === 'number' && taskId > 0,
  })
}

/**
 * Hook tạo Work Log mới (UC107).
 */
export function useCreateWorkLog(taskId: number) {
  const queryClient = useQueryClient()

  return useMutation<MentoringWorkLog, Error, CreateWorkLogPayload>({
    mutationFn: (payload) => mentoringTaskApi.createWorkLog(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.workLogs(taskId) })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })
    },
  })
}

/**
 * Hook cập nhật Work Log chưa xác nhận (UC107).
 */
export function useUpdateWorkLog(taskId: number) {
  const queryClient = useQueryClient()

  return useMutation<MentoringWorkLog, Error, { workLogId: number; payload: UpdateWorkLogPayload }>({
    mutationFn: ({ workLogId, payload }) => mentoringTaskApi.updateWorkLog(taskId, workLogId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.workLogs(taskId) })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })
    },
  })
}

/**
 * Hook Student xác nhận nghiệm thu Work Log (UC108).
 */
export function useConfirmWorkLog(taskId: number) {
  const queryClient = useQueryClient()

  return useMutation<MentoringWorkLog, Error, { workLogId: number; payload?: ConfirmWorkLogPayload }>({
    mutationFn: ({ workLogId, payload }) => mentoringTaskApi.confirmWorkLog(taskId, workLogId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.workLogs(taskId) })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })
    },
  })
}

/**
 * Hook Student yêu cầu điều chỉnh Work Log (UC108).
 */
export function useRejectWorkLog(taskId: number) {
  const queryClient = useQueryClient()

  return useMutation<MentoringWorkLog, Error, { workLogId: number; payload: RejectWorkLogPayload }>({
    mutationFn: ({ workLogId, payload }) => mentoringTaskApi.rejectWorkLog(taskId, workLogId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.workLogs(taskId) })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.lists() })
    },
  })
}

/**
 * Hook khởi tạo giao dịch thanh toán PayOS VietQR cho Mentoring Task (UC105).
 */
export function useCreateTaskPaymentCheckout() {
  const queryClient = useQueryClient()

  return useMutation<
    MentoringTaskPaymentCheckoutResponse,
    Error,
    CreateTaskPaymentRequest
  >({
    mutationFn: (payload) => mentoringTaskApi.createPaymentCheckout(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEAL_QUERY_KEYS.all })
    },
  })
}

/**
 * Hook lấy phiên thanh toán VietQR PayOS cho Mentoring Task (UC105).
 * Dùng useQuery reactive, cache 5 phút để hiển thị tức thì không bị treo loading spinner.
 */
export function useTaskPaymentCheckoutSession(dealId?: number, isEnabled = true, amendmentId?: number) {
  return useQuery<MentoringTaskPaymentCheckoutResponse, Error>({
    queryKey: TASK_QUERY_KEYS.checkoutSession(dealId, amendmentId),
    queryFn: () => mentoringTaskApi.createPaymentCheckout({ dealId: dealId!, amendmentId }),
    enabled: Boolean(dealId && dealId > 0) && isEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  })
}

/**
 * Hook hủy phiên thanh toán Mentoring Task.
 */
export function useCancelTaskPayment() {
  const queryClient = useQueryClient()

  return useMutation<
    MentoringTaskPaymentStatusResponse,
    Error,
    { orderCode: number; reason?: string }
  >({
    mutationFn: ({ orderCode, reason }) =>
      mentoringTaskApi.cancelPayment(orderCode, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEAL_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all })
    },
  })
}

/**
 * Hook Polling kiểm tra trạng thái thanh toán Mentoring Task từ PayOS theo chu kỳ 3s (UC105).
 * Tự động dừng polling khi thanh toán thành công (PAID) hoặc hủy/hết hạn.
 */
export function useTaskPaymentPolling(
  orderCode?: number,
  isEnabled = false,
  onPaid?: (res: MentoringTaskPaymentStatusResponse) => void
) {
  const queryClient = useQueryClient()
  const handledPaidOrderRef = useRef<number | null>(null)

  const query = useQuery<MentoringTaskPaymentStatusResponse, Error>({
    queryKey: TASK_QUERY_KEYS.paymentStatus(orderCode),
    queryFn: () => mentoringTaskApi.checkPaymentStatus(orderCode!),
    enabled: isEnabled && typeof orderCode === 'number' && orderCode > 0,
    refetchInterval: (queryResult) => {
      const data = queryResult.state.data
      if (!data) return 3000
      if (data.paymentStatus !== 'PENDING') {
        return false
      }
      return 3000
    },
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (
      !query.data ||
      query.data.paymentStatus !== 'PAID' ||
      typeof orderCode !== 'number' ||
      handledPaidOrderRef.current === orderCode
    ) {
      return
    }

    // Handle a paid order exactly once even when the modal recreates onPaid.
    handledPaidOrderRef.current = orderCode
    queryClient.invalidateQueries({ queryKey: DEAL_QUERY_KEYS.all })
    queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all })
    queryClient.invalidateQueries({ queryKey: MENTORING_CONVERSATION_QUERY_KEYS.all })
    if (onPaid) {
      onPaid(query.data)
    }
  }, [query.data, queryClient, onPaid, orderCode])

  return query
}

/**
 * Hook truy vấn báo cáo kết quả Task & trạng thái thanh toán toàn diện (UC114).
 */
export function useTaskReport(taskId?: number, enabled = true) {
  return useQuery<MentoringTaskReport, Error>({
    queryKey: TASK_QUERY_KEYS.report(taskId),
    queryFn: () => mentoringTaskApi.getTaskReport(taskId!),
    enabled: typeof taskId === 'number' && taskId > 0 && enabled,
    staleTime: 30000,
  })
}
