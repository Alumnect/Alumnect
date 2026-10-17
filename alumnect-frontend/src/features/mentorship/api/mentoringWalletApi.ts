import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type { MentoringWallet, MentorReview, RefundAccount } from '../model/mentoringWalletTypes'

export const mentoringWalletApi = {
  getEarnings: async () =>
    (await http.get<unknown, ApiResponse<MentoringWallet>>('/mentoring/wallet/earnings')).data,

  getRefunds: async () =>
    (await http.get<unknown, ApiResponse<MentoringWallet>>('/mentoring/wallet/refunds')).data,

  getRefundAccount: async () =>
    (await http.get<unknown, ApiResponse<RefundAccount | null>>('/mentoring/wallet/refund-account')).data,

  saveRefundAccount: async (payload: RefundAccount) =>
    (await http.put<unknown, ApiResponse<RefundAccount>>('/mentoring/wallet/refund-account', payload)).data,

  getTaskReview: async (taskId: number) =>
    (await http.get<unknown, ApiResponse<MentorReview | null>>(`/mentoring/reviews/tasks/${taskId}`)).data,

  submitReview: async (payload: { taskId: number; rating: number; comment?: string }) =>
    (await http.post<unknown, ApiResponse<MentorReview>>('/mentoring/reviews', payload)).data,
}
