import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type {
  CreateMentorPaymentRequest,
  MentorPaymentCheckoutResponse,
  PaymentTransactionStatusResponse,
} from '../model/mentorPaymentTypes'

/**
 * API client phục vụ thanh toán gói Mentor qua cổng PayOS (UC93).
 */
export const mentorPaymentApi = {
  /**
   * Khởi tạo giao dịch thanh toán gói Mentor PayOS.
   * Sinh mã VietQR động và đường dẫn PayOS Checkout.
   */
  createCheckout: async (
    data?: CreateMentorPaymentRequest
  ): Promise<MentorPaymentCheckoutResponse> => {
    const res = await http.post<any, ApiResponse<MentorPaymentCheckoutResponse>>(
      '/mentoring/subscriptions/payment/checkout',
      data || {}
    )
    return res.data
  },

  /**
   * Tra cứu trạng thái giao dịch thanh toán theo orderCode phục vụ Polling thời gian thực.
   */
  getPaymentStatus: async (
    orderCode: number
  ): Promise<PaymentTransactionStatusResponse> => {
    const res = await http.get<any, ApiResponse<PaymentTransactionStatusResponse>>(
      `/mentoring/subscriptions/payment/status/${orderCode}`
    )
    return res.data
  },

  /**
   * Hủy giao dịch thanh toán PayOS đang ở trạng thái PENDING.
   */
  cancelPayment: async (
    orderCode: number
  ): Promise<PaymentTransactionStatusResponse> => {
    const res = await http.post<any, ApiResponse<PaymentTransactionStatusResponse>>(
      `/mentoring/subscriptions/payment/cancel/${orderCode}`
    )
    return res.data
  },
}
