import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/Toast'
import { mentorPaymentApi } from '../api/mentorPaymentApi'
import { MENTOR_SUBSCRIPTION_KEYS } from './useMentorSubscription'
import type { CreateMentorPaymentRequest } from '../model/mentorPaymentTypes'

/** Key cache cho React Query */
export const MENTOR_PAYMENT_KEYS = {
  checkout: ['mentor-payment', 'checkout'] as const,
  status: (orderCode: number) => ['mentor-payment', 'status', orderCode] as const,
}

/**
 * Custom Hook khởi tạo giao dịch thanh toán PayOS (UC93).
 */
export function useCreateMentorPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data?: CreateMentorPaymentRequest) =>
      mentorPaymentApi.createCheckout(data),
    onSuccess: (response) => {
      toast.success('Thông tin thanh toán PayOS đã sẵn sàng!')
      queryClient.setQueryData(MENTOR_PAYMENT_KEYS.checkout, response)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể tạo phiên thanh toán PayOS. Vui lòng thử lại.')
    },
  })
}

/**
 * Custom Hook tra cứu và tự động Polling trạng thái giao dịch PayOS (chu kỳ 3 giây).
 * Tự động dừng polling khi giao dịch đạt terminal state (PAID, FAILED, EXPIRED, CANCELLED).
 * Khi đạt PAID: tự động invalidate toàn bộ cache của Mentor Subscription và Mentor Profile.
 */
export function useMentorPaymentStatus(orderCode: number | null | undefined, enabled = true) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: MENTOR_PAYMENT_KEYS.status(orderCode || 0),
    queryFn: () => mentorPaymentApi.getPaymentStatus(orderCode!),
    enabled: Boolean(orderCode && orderCode > 0) && enabled,
    refetchInterval: (queryState) => {
      const data = queryState.state.data
      // Dừng polling ngay khi đạt terminal state
      if (data?.isTerminal) {
        return false
      }
      return 3000 // Polling mỗi 3 giây
    },
    refetchIntervalInBackground: false,
  })

  // Khi phát hiện trạng thái thanh toán thành công, làm mới toàn bộ server state
  useEffect(() => {
    if (query.data?.paymentStatus === 'PAID') {
      queryClient.invalidateQueries({ queryKey: MENTOR_SUBSCRIPTION_KEYS.mySubscription })
      queryClient.invalidateQueries({ queryKey: ['mentor-registration'] })
      queryClient.invalidateQueries({ queryKey: ['mentor-status'] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    }
  }, [query.data?.paymentStatus, queryClient])

  return query
}

/**
 * Custom Hook hủy đơn thanh toán PayOS đang ở trạng thái PENDING.
 */
export function useCancelMentorPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderCode: number) => mentorPaymentApi.cancelPayment(orderCode),
    onSuccess: (_, orderCode) => {
      toast.info('Đã hủy giao dịch thanh toán thành công.')
      queryClient.invalidateQueries({ queryKey: MENTOR_PAYMENT_KEYS.status(orderCode) })
      queryClient.invalidateQueries({ queryKey: MENTOR_SUBSCRIPTION_KEYS.mySubscription })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể hủy giao dịch. Vui lòng thử lại.')
    },
  })
}
