/**
 * Các kiểu dữ liệu liên quan đến thanh toán gói Mentor qua PayOS (UC93).
 */

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED'

export interface CreateMentorPaymentRequest {
  packageId?: number
}

export interface MentorPaymentCheckoutResponse {
  transactionId: number
  orderCode: number
  amount: number
  packageId: number
  packageName: string
  durationMonths: number
  description: string
  qrCodeUrl: string
  checkoutUrl: string
  paymentStatus: PaymentStatus
  paymentExpiresAt: string
  accountNumber?: string
  accountName?: string
  bin?: string
}

export interface PaymentTransactionStatusResponse {
  transactionId: number
  orderCode: number
  amount: number
  paymentStatus: PaymentStatus
  paidAt?: string
  paymentExpiresAt: string
  subscriptionStatus?: 'PENDING_PAYMENT' | 'ACTIVE' | 'PAID' | 'CANCELLED' | 'EXPIRED'
  mentorStatus?: 'INCOMPLETE' | 'PAYMENT_PENDING' | 'ACTIVE' | 'EXPIRED'
  subscriptionStartDate?: string
  subscriptionEndDate?: string
  isTerminal: boolean
}
