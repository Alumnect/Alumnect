import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mentoringTaskApi } from '../api/mentoringTaskApi'
import { DEAL_QUERY_KEYS } from './useMentoringDeals'
import type { PageResponse } from '../model/mentoringDealTypes'
import type {
  CreateTaskPaymentRequest,
  MentoringTask,
  MentoringTaskPaymentCheckoutResponse,
  MentoringTaskPaymentStatusResponse,
  MentoringTaskStatus,
} from '../model/mentoringTaskTypes'

export const TASK_QUERY_KEYS = {
  all: ['mentoringTasks'] as const,
  lists: () => [...TASK_QUERY_KEYS.all, 'list'] as const,
  list: (status?: MentoringTaskStatus, page = 0, size = 10) =>
    [...TASK_QUERY_KEYS.lists(), { status, page, size }] as const,
  details: () => [...TASK_QUERY_KEYS.all, 'detail'] as const,
  detail: (id?: number) => [...TASK_QUERY_KEYS.details(), id] as const,
  payments: () => [...TASK_QUERY_KEYS.all, 'payment'] as const,
  paymentStatus: (paymentId?: number) =>
    [...TASK_QUERY_KEYS.payments(), paymentId] as const,
}

/**
 * Hook truy vấn danh sách Mentoring Tasks của người dùng hiện tại (UC105).
 */
export function useMyTasks(
  status?: MentoringTaskStatus,
  page = 0,
  size = 10
) {
  return useQuery<PageResponse<MentoringTask>, Error>({
    queryKey: TASK_QUERY_KEYS.list(status, page, size),
    queryFn: () => mentoringTaskApi.getMyTasks({ status, page, size }),
  })
}

/**
 * Hook truy vấn chi tiết một Mentoring Task theo ID (UC105).
 */
export function useTaskDetail(taskId?: number) {
  return useQuery<MentoringTask, Error>({
    queryKey: TASK_QUERY_KEYS.detail(taskId),
    queryFn: () => mentoringTaskApi.getTaskDetail(taskId!),
    enabled: typeof taskId === 'number' && taskId > 0,
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
 * Hook hủy phiên thanh toán Mentoring Task.
 */
export function useCancelTaskPayment() {
  const queryClient = useQueryClient()

  return useMutation<
    MentoringTaskPaymentStatusResponse,
    Error,
    { paymentId: number; reason?: string }
  >({
    mutationFn: ({ paymentId, reason }) =>
      mentoringTaskApi.cancelPayment(paymentId, reason),
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
  paymentId?: number,
  isEnabled = false,
  onPaid?: (res: MentoringTaskPaymentStatusResponse) => void
) {
  const queryClient = useQueryClient()

  const query = useQuery<MentoringTaskPaymentStatusResponse, Error>({
    queryKey: TASK_QUERY_KEYS.paymentStatus(paymentId),
    queryFn: () => mentoringTaskApi.checkPaymentStatus(paymentId!),
    enabled: isEnabled && typeof paymentId === 'number' && paymentId > 0,
    refetchInterval: (queryResult) => {
      const data = queryResult.state.data
      if (!data) return 3000
      if (
        data.isSuccess ||
        data.status === 'PAID' ||
        data.status === 'CANCELLED' ||
        data.status === 'EXPIRED' ||
        data.status === 'FAILED'
      ) {
        return false
      }
      return 3000
    },
    refetchIntervalInBackground: true,
  })

  useEffect(() => {
    if (query.data && (query.data.isSuccess || query.data.status === 'PAID')) {
      queryClient.invalidateQueries({ queryKey: DEAL_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all })
      if (onPaid) {
        onPaid(query.data)
      }
    }
  }, [query.data, queryClient, onPaid])

  return query
}
